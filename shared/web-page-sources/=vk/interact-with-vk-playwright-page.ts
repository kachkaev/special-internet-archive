/* eslint-disable @typescript-eslint/naming-convention,unicorn/consistent-function-scoping -- needed for playwrightPage.evaluate() */

import { DateTime } from "luxon";

import { AbortError } from "../../errors";
import { calculateDaysBetween, unserializeTime } from "../../time";
import {
  InteractWithPlaywrightPage,
  PlaywrightPageInteractionPayload,
} from "../types";
import { parseRawVkTime } from "./parse-raw-vk-time";
import { serializeVkDate } from "./serialize-vk-date";

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

const listRawDatesToScrollPast = ({
  lastSeenBottomPostTime,
  relevantTimeMin,
}: {
  lastSeenBottomPostTime: string;
  relevantTimeMin: string;
}): string[] => {
  const startDateTime = unserializeTime(lastSeenBottomPostTime)
    .setZone("Europe/Moscow")
    .startOf("day");
  const dateTimeMinMinusOneDay = unserializeTime(relevantTimeMin).minus({
    day: 1,
  });

  const candidateStopDateTime =
    startDateTime.day === 1
      ? startDateTime.minus({ month: 1 }).set({ day: 15 })
      : startDateTime.day <= 15
      ? startDateTime.set({ day: 1 })
      : startDateTime.set({ day: 15 });

  const stopDateTime = (
    dateTimeMinMinusOneDay > candidateStopDateTime
      ? dateTimeMinMinusOneDay
      : candidateStopDateTime
  )
    .setZone("Europe/Moscow")
    .startOf("day");

  const result: string[] = [];

  let dateTime = startDateTime;
  while (calculateDaysBetween(stopDateTime, dateTime) >= 1) {
    result.push(serializeVkDate(dateTime));
    dateTime = dateTime.minus({ days: 1 });
  }

  return result;
};

const scrollPosts = async (
  payload: PlaywrightPageInteractionPayload,
): Promise<void> => {
  const dateTimeAtScrollIterationStart = DateTime.local();
  const {
    abortSignal,
    playwrightPage,
    snapshotContext: { relevantTimeMin },
    log,
  } = payload;

  let authModalAlreadyClosed = false;
  let lastSeenBottomPostTime: string | undefined;

  for (;;) {
    const rawDatesToScrollPast =
      lastSeenBottomPostTime && authModalAlreadyClosed
        ? listRawDatesToScrollPast({
            lastSeenBottomPostTime,
            relevantTimeMin,
          })
        : [];

    // All interactions are placed inside a single evaluate call to reduce the number of
    // Playwright actions in the trace. This speeds up page capturing and reduces trace size.
    const bottomPostRawTime = await playwrightPage.evaluate<
      string | undefined,
      string[]
    >(async (_rawDatesToScrollPast) => {
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

      const _extractRawDate = (rawTime: string): string =>
        (rawTime.match(/^(\d+\s)?\p{L}+(\s\d{4})?/u)?.[0] ?? "").replace(
          /\s/g,
          " ",
        );

      const _sleep = (timeout: number) =>
        new Promise((resolve) => setTimeout(resolve, timeout));

      const initialBottomPostRawTime = _extractBottomPostRawTime();
      if (!initialBottomPostRawTime) {
        return;
      }
      let previousBottomPostDate = _extractRawDate(initialBottomPostRawTime);
      let previousBottomPostRawTime = initialBottomPostRawTime;
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

        // Stop scrolling when seeing a new date (unless we should scroll past it)
        const currentBottomPostDate = _extractRawDate(currentBottomPostRawTime);
        if (previousBottomPostDate !== currentBottomPostDate) {
          if (!_rawDatesToScrollPast.includes(currentBottomPostDate)) {
            return currentBottomPostRawTime;
          }
          previousBottomPostDate = currentBottomPostDate;
        }
      }
    }, rawDatesToScrollPast);

    if (abortSignal?.aborted) {
      throw new AbortError();
    }

    // Early exit if the wall is empty
    if (!bottomPostRawTime) {
      break;
    }

    if (!authModalAlreadyClosed) {
      authModalAlreadyClosed = await closeAuthModalIfPresent(payload);
    }

    // Early exit reached the bottom of the wall
    const bottomPostTime = parseRawVkTime(bottomPostRawTime);
    if (lastSeenBottomPostTime === bottomPostTime) {
      break;
    }
    lastSeenBottomPostTime = bottomPostTime;

    const serializedDuration = DateTime.local()
      .diff(dateTimeAtScrollIterationStart)
      .toFormat("hh:mm:ss");

    log?.(`Scrolled to ${bottomPostTime} in ${serializedDuration}`);

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
