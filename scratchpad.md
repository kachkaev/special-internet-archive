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

steps

mvp

`web-page.json` → `annotation`

```json
{
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

label
  метка
```

## Telegram chat logo

https://www.fotojet.com/apps/?entry=edit (old photo 3v)

## TODO

- extract snapshot summaries
- extract snapshot summary combination
- mark posts as relevant
- mark posts as relevant
- proxy for web.archive.org
