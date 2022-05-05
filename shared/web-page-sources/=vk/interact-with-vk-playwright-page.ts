/* eslint-disable @typescript-eslint/naming-convention,unicorn/consistent-function-scoping -- needed for playwrightPage.evaluate() */

import { AbortError } from "../../errors";
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

const scrollPosts = async (
  payload: PlaywrightPageInteractionPayload,
): Promise<void> => {
  await closeAgeRestrictionModalIfPreset(payload);

  const {
    abortSignal,
    playwrightPage,
    snapshotContext: { relevantTimeMin },
  } = payload;

  let authModalAlreadyClosed = false;
  let lastSeenBottomPostRawTime: string | undefined;

  for (;;) {
    // Scroll by at least 1 day
    // @todo Use a heuristic to scroll for more than one unique day inside evaluate
    // to reduce the number of actions and to speed up capturing

    // All interactions are placed inside a single evaluate call to reduce the number of
    // Playwright actions in the trace. This speeds up page capturing and reduces trace size.
    const bottomPostRawTime = await playwrightPage.evaluate<string | undefined>(
      async () => {
        /** @returns "1 марта в 04:42" or "сегодня в 04:42"  */
        const _extractRawTime = (dateElement: Element): string => {
          return (
            dateElement.getAttribute("abs_time") ??
            dateElement.textContent ??
            ""
          );
        };

        const _extractBottomPostRawTime = (): string | undefined => {
          const bottomPostDateElement = [
            ...document.body.querySelectorAll(".post .rel_date"),
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
        const initialBottomPostDate = _extractRawDay(initialBottomPostRawTime);
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

          // Stop scrolling if scrolled to a new day
          if (
            initialBottomPostDate !== _extractRawDay(currentBottomPostRawTime)
          ) {
            return currentBottomPostRawTime;
          }
        }
      },
    );

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
    await scrollPosts(payload);

    return;
  }

  // Post page
  // @todo Implement interaction (capture likes)
};
