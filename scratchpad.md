# Special Internet Archive – scratchpad

Shared between collections

```yaml
labels:
  - z
  - v
  - география|Пенза
  - тема|погибшие
  - тема|фейки
  - тип|местное сообщество
  - тип|государственный орган
  - тип|университет
  - тип|школа

annotation:
  relevantText:
    - z
    - v
    - военн
    - зароссию
    - киев
    - мыzaмир
    - мызaмир
    - нацизм
    - нацист
    - санкции
    - санкций
    - своихнебросаем
    - украин
    - фашист
```

data

```yaml
# = .gitignore
collection-config.yml
snapshot-queues:
  playwright.json
  wayback-machine.json
web-pages:
  vk:
    accounts:
      penza_live:
        items:
          2022-03-10-011223z-playwright.zip
        # 2022-03-10-011223z-playwright.zip.summary.json
          2022-04-05-424312z-playwright.zip
        # 2022-04-05-424312z-playwright.zip.summary.json
      # snapshot-summary-combination.json
        web-page.json
    posts:
      "-161982468":
        "12345":
          items:
            2022-03-10-011223z-playwright.zip
          # 2022-03-10-011223z-playwright.zip.summary.json
            2022-04-05-424312z-playwright.zip
          # 2022-04-05-424312z-playwright.zip.summary.json
        # snapshot-summary-combination.json
          web-page.json
    photos:
      "-189058660":
        "457289204":
          items:
            2022-03-10-011223z-playwright.zip
          # 2022-03-10-011223z-playwright.zip.summary.json
            2022-04-05-424312z-playwright.zip
          # 2022-04-05-424312z-playwright.zip.summary.json
        # snapshot-summary-combination.json
          web-page.json
```

```txt
http://web.archive.org/cdx/search/cdx?url=https://vk.com/penza_live
http://web.archive.org/cdx/search/cdx?url=https://m.vk.com/penza_live
```

steps

mvp

`web-page.json`

```json
{
  "documentType": "webPage",
  "webPageUrl": "https://vk.com/penza_live",
  "registeredAt": "2022-04-06T00:00:00Z",
  "registeredVia": "??",
  "annotation": {
    "webPageType": "vkUser",
    "labels": ["hello|world"],
    "vkWall": {
      "allRelevant": true,
      "allRelevantVia": "ui",
      "postLookup": {
        "/wall-12345-12345": {
          "relevant": true,
          "relevantVia": "ui"
        }
      }
    }
  },
  "snapshotInventoryLookup": {
    "playwright": {
      "updatedAt": "2022-04-06T00:00:00Z",
      "items": [
        {
          "capturedAt": "2022-04-06T00:00:00Z"
        },
        {
          "capturedAt": "2022-04-06T00:00:00Z"
        },
        {
          "capturedAt": "2022-04-06T00:00:00Z"
        }
      ]
    },
    "waybackMachine": {
      "updatedAt": "2022-04-06T00:00:00Z",
      "items": [
        {
          "capturedAt": "2022-04-06T00:00:00Z"
        },
        {
          "aliasUrl": "https://vk.com/penza_live",
          "capturedAt": "2022-04-06T00:00:00Z"
        },
        {
          "capturedAt": "2022-04-06T00:00:00Z"
        }
      ]
    }
  }
}
```

`snapshot-queues/playwright.json`

```json
{
  "documentType": "snapshotQueue",
  "snapshotGeneratorId": "playwright",
  "items": [
    {
      "webPageUrl": "https://vk.com/penza_live",
      "addedAt": "2022-04-06T00:00:00Z",
      "context": {
        "relevantTimeMin": "2022-04-06T00:00:00Z"
      },
      "attempts": [
        {
          "attemptedAt": "2022-04-06T00:00:00Z",
          "status": "started",
          "message": "..."
        }
      ]
    }
  ]
}
```

`2022-03-10-011223z-playwright.zip.summary.json`

```json
{
  "documentType": "snapshotSummary",
  "webPageUrl": "https://vk.com/penza_live",
  "capturedAt": "2022-04-06T00:00:00Z",
  "generatedAt": "2022-04-06T00:00:00Z"
}
```

`snapshot-summary-combination.json`

```json
{
  "documentType": "snapshotSummaryCombination",
  "webPageUrl": "https://vk.com/penza_live",
  "combinedAt": "2022-04-06T00:00:00Z"
}
```

## Glossary

```txt
snapshot
  снимок

summary
  сводка

to capture
  сделать снимок

snapshot generator
  генератор снимков

inventory
  инвентаризация (учёт?)
```

## Telegram chat logo

https://www.fotojet.com/apps/?entry=edit (old photo 3v)
