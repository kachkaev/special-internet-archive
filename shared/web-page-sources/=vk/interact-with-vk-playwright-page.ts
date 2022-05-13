/* eslint-disable @typescript-eslint/naming-convention,unicorn/consistent-function-scoping -- needed for playwrightPage.evaluate() */

import { AbortError } from "../../errors";
import {
  calculateDaysBetween,
  serializeTime,
  unserializeTime,
} from "../../time";
import {
  InteractWithPlaywrightPage,
  PlaywrightPageInteractionPayload,
} from "../types";
import { parseRawVkTime } from "./parse-raw-vk-time";

const closeAuthModalIfPresent = async ({
  playwrightPage,
}: PlaywrightPageInteractionPayload): Promise<boolean> => {
  const button = playwrightPage.locator(".UnauthActionBox__close").nth(0);
  if (await button.isVisible()) {
    await button.click();

    return true;
  }

  return false;
};

// e.g. https://vk.com/newstregion is 18+ for some reason
const closeAgeRestrictionModalIfPreset = async ({
  playwrightPage,
}: PlaywrightPageInteractionPayload): Promise<boolean> => {
  const checkbox = playwrightPage.locator(".group_age_checkbox").nth(0);
  if (await checkbox.isVisible()) {
    await checkbox.click();
    await playwrightPage
      .locator(".group_age_disclaimer_box .FlatButton--primary")
      .click();

    return true;
  }

  return false;
};

interface BatchScrollInfo {
  bottomPostTime: string;
  uniqueDayCountInBatchScroll: number;
}

/**
 * We scroll by at least 1 day.
 * A heuristic to scroll for more than one unique day inside evaluate
 * helps reduce the number of actions and to speed up capturing
 */
const guessUniqueDayCountInNextScroll = ({
  batchScrollInfos,
  relevantTimeMax,
  relevantTimeMin,
}: {
  batchScrollInfos: BatchScrollInfo[];
  relevantTimeMax: string;
  relevantTimeMin: string;
}): number => {
  const bottomPostTime = batchScrollInfos.at(-1)?.bottomPostTime;
  if (!bottomPostTime) {
    return 1;
  }

  let uniqueDayCountInAllScrolls = 0;
  for (const { uniqueDayCountInBatchScroll } of batchScrollInfos) {
    uniqueDayCountInAllScrolls += uniqueDayCountInBatchScroll;
  }

  const scrolledDayCount = calculateDaysBetween(
    bottomPostTime,
    relevantTimeMax,
  );

  const meanDaysPerScroll = scrolledDayCount / uniqueDayCountInAllScrolls;

  const bottomPostDateTime = unserializeTime(bottomPostTime);
  const relevantDateTimeMin = unserializeTime(relevantTimeMin);

  for (const uniqueDayCountCandidate of [20, 10, 5, 2]) {
    // Gradually speed up
    if (uniqueDayCountInAllScrolls < uniqueDayCountCandidate) {
      continue;
    }
    const estimatedLandingDateTime = bottomPostDateTime.minus({
      days: Math.floor(uniqueDayCountCandidate * meanDaysPerScroll),
    });

    const estimatedUniqueDatesInTail =
      estimatedLandingDateTime.diff(relevantDateTimeMin).as("days") /
      meanDaysPerScroll;

    // Gradually slow down
    if (estimatedUniqueDatesInTail < uniqueDayCountCandidate) {
      continue;
    }

    return uniqueDayCountCandidate;
  }

  return 1;
};

const scrollPosts = async (
  payload: PlaywrightPageInteractionPayload,
): Promise<void> => {
  const {
    abortSignal,
    playwrightPage,
    snapshotContext: { relevantTimeMin },
    log,
  } = payload;

  let authModalAlreadyClosed = false;
  let lastSeenBottomPostRawTime: string | undefined;
  const batchScrollInfos: BatchScrollInfo[] = [];
  const relevantTimeMax = serializeTime();

  for (;;) {
    const uniqueDayCountInBatchScroll = guessUniqueDayCountInNextScroll({
      batchScrollInfos,
      relevantTimeMin,
      relevantTimeMax,
    });

    // All interactions are placed inside a single evaluate call to reduce the number of
    // Playwright actions in the trace. This speeds up page capturing and reduces trace size.
    const bottomPostRawTime = await playwrightPage.evaluate<
      string | undefined,
      number
    >(async (_uniqueDayCountInBatchScroll) => {
      /** @returns "1 марта в 04:42" or "сегодня в 04:42"  */
      const _extractRawTime = (dateElement: Element): string => {
        return (
          dateElement.getAttribute("abs_time") ?? dateElement.textContent ?? ""
        );
      };

      const _extractBottomPostRawTime = (): string | undefined => {
        const bottomPostDateElement = [
          ...document.body.querySelectorAll(".post_date .rel_date"),
        ].pop();

        return bottomPostDateElement
          ? _extractRawTime(bottomPostDateElement)
          : undefined;
      };

      const _extractRawDay = (rawTime: string): string =>
        rawTime.match(/^(\d+ )?\p{L}+/u)?.[0] ?? "";

      const _sleep = (timeout: number) =>
        new Promise((resolve) => setTimeout(resolve, timeout));

      const initialBottomPostRawTime = _extractBottomPostRawTime();
      if (!initialBottomPostRawTime) {
        return;
      }
      let previousBottomPostDate = _extractRawDay(initialBottomPostRawTime);
      let previousBottomPostRawTime = initialBottomPostRawTime;
      let uniqueDayCountLeftToScroll = _uniqueDayCountInBatchScroll - 1;
      for (;;) {
        // Scroll to bottom
        window.scrollTo(0, document.body.scrollHeight);

        // Wait for posts to load
        do {
          await _sleep(100);
        } while (document.body.querySelector("#wall_more_link #btn_lock"));
        await _sleep(100);

        // Expand all visible posts
        for (;;) {
          const expandPostLink = [
            ...document.body.querySelectorAll(".wall_post_more"),
          ].find((element) => element.clientHeight > 0);

          if (!expandPostLink) {
            break;
          }

          expandPostLink.dispatchEvent(new MouseEvent("click"));
          await _sleep(50);
        }

        // Find last loaded post time
        const currentBottomPostRawTime = _extractBottomPostRawTime()!;

        // Stop scrolling if no new posts have been loaded
        if (previousBottomPostRawTime === currentBottomPostRawTime) {
          return currentBottomPostRawTime;
        }
        previousBottomPostRawTime = currentBottomPostRawTime;

        // Stop scrolling if scrolled to a new day
        const currentBottomPostDate = _extractRawDay(currentBottomPostRawTime);
        if (previousBottomPostDate !== currentBottomPostDate) {
          if (uniqueDayCountLeftToScroll === 0) {
            return currentBottomPostRawTime;
          }
          previousBottomPostDate = currentBottomPostDate;
          uniqueDayCountLeftToScroll -= 1;
        }
      }
    }, uniqueDayCountInBatchScroll);

    if (abortSignal?.aborted) {
      throw new AbortError();
    }

    if (!authModalAlreadyClosed) {
      authModalAlreadyClosed = await closeAuthModalIfPresent(payload);
      continue;
    }

    // Early exit if the wall is empty
    if (!bottomPostRawTime) {
      break;
    }

    // Early exit reached the bottom of the wall
    if (lastSeenBottomPostRawTime === bottomPostRawTime) {
      break;
    }
    lastSeenBottomPostRawTime = bottomPostRawTime;

    const bottomPostTime = parseRawVkTime(bottomPostRawTime);

    batchScrollInfos.push({
      bottomPostTime,
      uniqueDayCountInBatchScroll,
    });

    log?.(
      `Scrolled to ${bottomPostTime}${
        uniqueDayCountInBatchScroll !== 1
          ? ` (unique post dates: ${uniqueDayCountInBatchScroll})`
          : ""
      }`,
    );

    if (bottomPostTime < relevantTimeMin) {
      break;
    }
  }
};

export const interactWithVkPlaywrightPage: InteractWithPlaywrightPage = async (
  payload,
) => {
  // Account page (contains posts in a wall)
  if (
    await payload.playwrightPage
      .locator("#public_wall,#group_wall,#profile_wall")
      .isVisible()
  ) {
    await closeAgeRestrictionModalIfPreset(payload);
    await scrollPosts(payload);

    return;
  }

  // Post page
  // @todo Implement interaction (capture likes)
};
