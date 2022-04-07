# Special archive

```yaml
capturing:
  default:
    timeZone: "UTC+03:00" ## MSK+0h
  vkAccount:
    scrollToPostAt: "2022-04-07T11:08:00.420Z"

## collection config
vk:
  feeds:
    - url: https://vk.com/penza_live
      name: Пенза live
      labels:
        - z
        - тип|городское сообщество
        - география|Пенза

    - url: https://vk.com/penzaoblgov
      name: Пензенская область
      labels:
        - z
        - тип|официальная страница
        - география|Пензенская область
        - z

    - url: https://vk.com/pnzgu
      name: Пензенский государственный университет | ПГУ
        labels:
          - z
          - тип|университет
          - область Пензенская
```

Shared between collections

```yaml
labels:
  -

importantAutoSelectors:
  - \#зароссию
  - \#мыzaмир
  - \#мызaмир
  - \#своихнебросаем
  - z
  - санкции
  - санкций
  - нацизм
  - киев
  - военн
  - украин

earliest date:
  -
```

data

```yaml
sources:
  vk:
    accounts:
      penza_live:
        captures:
          2022-03-10-011223-utc.zip
          2022-03-10-011223-utc.json
          2022-04-05-424312-utc.zip
          2022-04-05-424312-utc.json
        capture-compilation.json
        web-resource.json
    posts:
      wall-161982468:
        "12345":
          captures:
            2022-03-10-011223-utc.zip
            2022-03-10-011223-utc.json
            2022-04-05-424312-utc.zip
            2022-04-05-424312-utc.json
          capture-compilation.json
          web-resource.json
```

```txt
http://web.archive.org/cdx/search/cdx?url=https://vk.com/penza_live
http://web.archive.org/cdx/search/cdx?url=https://m.vk.com/penza_live
```

steps

mvp

1.  get feed snapshot (local time = MSK?)
1.  parse feed snapshot
1.  pick important posts (populate `post-config.json`)
1.  fetch `post-web-archive.json`
1.  submit posts to web archive
1.  fetch `post-web-archive.json`

post-mvp

1.  submit feeds to web archive (interval)

1.  get post snapshot

`web-resource.json`

```json
{
  "documentKind": "webResource",
  "url": "https://vk.com/penza_live",
  "urlAddedAt": "2022-04-07T11:08:00.420Z",
  "urlAddedVia": "??",
  "capturing": {
    "submissions": [
      {
        "requestedAt": "2022-04-07T11:08:00.420Z",
        "requestedVia": "??",
        "config": {
          "scrollToPostAt": "2022-04-07T11:08:00.420Z"
        },
        "attempts": [
          {
            "startedAt": "2022-04-07T11:08:00.420Z",
            "status": "success"
          }
        ]
      }
    ]
  },
  "internetArchive": {
    "cdxByAlias": {
      "https://vk.com/penza_live": {
        "fetchedAt": "2022-04-07T11:08:00.420Z",
        "timestmaps": []
      },
      "https://m.vk.com/penza_live": {
        "fetchedAt": "2022-04-07T11:08:00.420Z",
        "timestmaps": []
      }
    },
    "submissions": [
      {
        "requestedAt": "2022-04-07T11:08:00.420Z",
        "requestedVia": "??",
        "attempts": [
          {
            "startedAt": "2022-04-07T11:08:00.420Z",
            "status": "success"
          }
        ]
      }
    ]
  },
  "contentAnnotation": {
    "labels": ["hello|world"],
    "postLookup": {
      "/wall-12345-12345": {
        "important": true,
        "importantVia": "ui"
      }
    }
  }
}
```

`capture-2022-03-10-011223.json`

```json
{
  "documentKind": "captureExtract",
  "url": "https://vk.com/penza_live",
  "capturedAt": "2022-04-07T11:08:00.420Z",
  "extractedAt": "2022-04-07T11:08:00.420Z"
}
```

`capture-compilation.json`

```json
{
  "documentKind": "captureCompilation",
  "url": "https://vk.com/penza_live",
  "compiledAt": "2022-04-07T11:08:00.420Z"
}
```
