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
    - covid
    - v
    - z
    - азов
    - апте
    - арме
    - арми
    - байд
    - банк
    - баталь
    - валют
    - воен
    - воин
    - войн
    - глав
    - граждан
    - греч
    - губерн
    - днр
    - долг
    - доллар
    - донба
    - евро
    - займ
    - зеленск
    - импорт
    - киев
    - корон
    - кредит
    - лекарств
    - лнр
    - магаз
    - мигра
    - моск
    - мызaмир
    - налог
    - наци
    - памят
    - пандеми
    - побед
    - погиб
    - правитель
    - презид
    - продукт
    - путин
    - росси
    - рубл
    - рынок
    - санкц
    - сахар
    - своихнебросаем
    - спецоперац
    - ссср
    - супермарк
    - сша
    - украин
    - фашист
    - фейк
    - цен
    - эваку
    - экономи
    - экспорт
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
- proxy for web.archive.org
