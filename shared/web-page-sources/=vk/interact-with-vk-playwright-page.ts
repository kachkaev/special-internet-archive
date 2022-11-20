import { DateTime } from "luxon";
import { Page } from "playwright";

import { AbortError } from "../../errors";
import { calculateDaysBetween, unserializeTime } from "../../time";
import {
  InteractWithPlaywrightPage,
  PlaywrightPageInteractionPayload,
} from "../types";
import { CategorizedVkUrl } from "./categorize-vk-url";
import { parseRawVkTime } from "./parse-raw-vk-time";
import { serializeVkDate } from "./serialize-vk-date";

const maxNumberOfPosts = 4000;

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

const scrollWallPosts = async (
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
    /* eslint-disable @typescript-eslint/naming-convention,unicorn/consistent-function-scoping */

    // All interactions are placed inside a single evaluate call to reduce the number of
    // Playwright actions in the trace. This speeds up page capturing and reduces trace size.
    const [bottomPostRawTime, numberOfPosts] = await playwrightPage.evaluate<
      [string | undefined, number],
      [string[], number]
    >(
      async ([_rawDatesToScrollPast, _maxNumberOfPosts]) => {
        /** @returns "1 марта в 04:42" or "сегодня в 04:42"  */
        const _extractRawTime = (dateElement: Element): string => {
          return (
            dateElement.getAttribute("abs_time") ??
            dateElement.textContent ??
            ""
          );
        };

        const _listPostDateElements = (): NodeListOf<Element> => {
          return document.body.querySelectorAll(".post_date .rel_date");
        };

        const _extractBottomPostRawTime = (
          postDateElements: NodeListOf<Element>,
        ): string | undefined => {
          const bottomPostDateElement = [...postDateElements].pop();

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

        const initialBottomPostRawTime = _extractBottomPostRawTime(
          _listPostDateElements(),
        );
        if (!initialBottomPostRawTime) {
          return [undefined, 0];
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
          const postDateElements = _listPostDateElements();
          const currentBottomPostRawTime =
            _extractBottomPostRawTime(postDateElements)!;
          const currentNumberOfPosts = postDateElements.length;

          // Stop scrolling if no new posts have been loaded
          if (previousBottomPostRawTime === currentBottomPostRawTime) {
            return [currentBottomPostRawTime, currentNumberOfPosts];
          }
          previousBottomPostRawTime = currentBottomPostRawTime;

          // Stop scrolling when seeing a new date (unless we should scroll past it)
          const currentBottomPostDate = _extractRawDate(
            currentBottomPostRawTime,
          );
          if (previousBottomPostDate !== currentBottomPostDate) {
            if (!_rawDatesToScrollPast.includes(currentBottomPostDate)) {
              return [currentBottomPostRawTime, currentNumberOfPosts];
            }
            previousBottomPostDate = currentBottomPostDate;
          }

          // Stop scrolling if reached max number of posts
          if (currentNumberOfPosts > _maxNumberOfPosts) {
            return [currentBottomPostRawTime, currentNumberOfPosts];
          }
        }
      },
      [rawDatesToScrollPast, maxNumberOfPosts],
    );

    /* eslint-enable @typescript-eslint/naming-convention,unicorn/consistent-function-scoping */

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

    // Early exit if the wall contains too many posts
    if (numberOfPosts > maxNumberOfPosts) {
      log?.(
        `Stopped scrolling after loading ${numberOfPosts} posts (> ${maxNumberOfPosts})`,
      );
      break;
    }

    if (bottomPostTime < relevantTimeMin) {
      break;
    }
  }
};

const scrollAlbumPhotos = async (
  payload: PlaywrightPageInteractionPayload,
): Promise<void> => {
  await payload.playwrightPage.evaluate(() => {
    return new Promise<void>((resolve) => {
      let scrollY = 0;
      const scrollDownOrCapture = () => {
        window.scrollTo({ left: window.scrollX, top: 10_000_000 });
        const newScrollY = window.scrollY;

        const photoUrls = [
          ...document.querySelectorAll<HTMLElement>(".photos_row"),
        ].map((element) =>
          element.style.backgroundImage.replace(/^url\("(.+)"\)$/, "$1"),
        );

        let numberOfCompletedImages = 0;
        const handleImageComplete = () => {
          numberOfCompletedImages += 1;
          if (numberOfCompletedImages !== photoUrls.length) {
            return;
          }

          if (
            document.querySelector<HTMLElement>("#ui_photos_load_more")
              ?.offsetHeight ||
            newScrollY !== scrollY
          ) {
            scrollY = newScrollY;

            window.requestIdleCallback(scrollDownOrCapture);
          } else {
            resolve();
          }
        };

        for (const photoUrl of photoUrls) {
          const image = new Image();
          image.src = photoUrl;
          image.addEventListener("load", handleImageComplete);
          image.addEventListener("error", handleImageComplete);
        }
      };

      scrollDownOrCapture();
    });
  });

  await closeAuthModalIfPresent(payload);
};

const captureLikes = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  payload: PlaywrightPageInteractionPayload,
): Promise<void> => {
  // @todo Implement interaction (capture likes)
};

type VkPageContentType = CategorizedVkUrl["vkPageType"];

const guessVkPageContentType = async (
  playwrightPage: Page,
): Promise<VkPageContentType | undefined> => {
  return playwrightPage.evaluate(() => {
    const resultBySelector: Record<VkPageContentType, string> = {
      account: "#public_wall,#group_wall,#profile_wall",
      album: "#photos_all_block",
      post: ".big_wall",
      photo: ".photo_box_img_wrap",
    };

    for (const [result, selector] of Object.entries(resultBySelector) as Array<
      [VkPageContentType, string]
    >) {
      if (document.querySelector<HTMLElement>(selector)?.offsetHeight) {
        return result;
      }
    }
  });
};

export const interactWithVkPlaywrightPage: InteractWithPlaywrightPage = async (
  payload,
) => {
  const guessedPageType = await guessVkPageContentType(payload.playwrightPage);

  await closeAgeRestrictionModalIfPreset(payload);

  switch (guessedPageType) {
    case "account": {
      await scrollWallPosts(payload);
      break;
    }
    case "album": {
      await scrollAlbumPhotos(payload);
      break;
    }
    case "photo":
    case "post": {
      await captureLikes(payload);
      break;
    }
    default: {
      // Any other page – no interaction
    }
  }
};
