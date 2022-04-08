# Special archive

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
collection-config.yml
web-pages:
  vk:
    accounts:
      penza_live:
        capturing:
          capture-2022-03-10-011223.zip
          capture-2022-03-10-011223-info.json
          capture-2022-04-05-424312.zip
          capture-2022-04-05-424312-info.json
          capture-info-combination.json
        web-page.json
    posts:
      "-161982468":
        "12345":
          capturing:
            capture-2022-03-10-011223.zip
            capture-2022-03-10-011223-info.json
            capture-2022-04-05-424312.zip
            capture-2022-04-05-424312-info.json
            capture-info-combination.json
          web-page.json
    photos:
      "-189058660":
        "457289204":
          capturing:
            capture-2022-03-10-011223.zip
            capture-2022-03-10-011223-info.json
            capture-2022-04-05-424312.zip
            capture-2022-04-05-424312-info.json
            capture-info-combination.json
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
  "url": "https://vk.com/penza_live",
  "registeredAt": "2022-04-07T11:08:00.420Z",
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
  "capturing": {
    "submissions": [
      {
        "plannedAt": "2022-04-07T11:08:00.420Z",
        "plannedVia": "script",
        "reason": "",
        "interactionConfig": {
          "scrollWallUntil": "2022-04-07T11:08:00.420Z"
        },
        "attempts": [
          {
            "startedAt": "2022-04-07T11:08:00.420Z",
            "status": "completed"
          }
        ]
      }
    ]
  },
  "internetArchive": {
    "snapshotListByAlias": {
      "https://vk.com/penza_live": {
        "fetchedAt": "2022-04-07T11:08:00.420Z",
        "snapshotTimestamps": []
      },
      "https://m.vk.com/penza_live": {
        "fetchedAt": "2022-04-07T11:08:00.420Z",
        "snapshotTimestamps": []
      }
    },
    "submissions": [
      {
        "plannedAt": "2022-04-07T11:08:00.420Z",
        "plannedVia": "??",
        "attempts": [
          {
            "startedAt": "2022-04-07T11:08:00.420Z",
            "status": "success"
          }
        ]
      }
    ]
  }
}
```

`capture-2022-03-10-011223-info.json`

```json
{
  "documentType": "captureInfo",
  "url": "https://vk.com/penza_live",
  "capturedAt": "2022-04-07T11:08:00.420Z",
  "extractedAt": "2022-04-07T11:08:00.420Z"
}
```

`capture-info-combination.json`

```json
{
  "documentType": "captureInfoCombination",
  "url": "https://vk.com/penza_live",
  "combinedAt": "2022-04-07T11:08:00.420Z"
}
```
