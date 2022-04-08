# Спецархив

## Инструкции

Чтобы собрать коллекцию веб-страниц, вам понадобятся:

- базовое понимание [командной строки](https://ru.wikipedia.org/wiki/Интерфейс_командной_строки) (терминала),
- небольшой опыт работы с [гитом](https://ru.wikipedia.org/wiki/Git) (системой контроля версий),
- поверхностное знакомство с форматами [JSON](https://ru.wikipedia.org/wiki/JSON) и [YAML](https://ru.wikipedia.org/wiki/YAML).

В качестве текстового редактора рекомендуется [VSCode](https://code.visualstudio.com) с расширениями
[DotENV](https://marketplace.visualstudio.com/items?itemName=mikestead.dotenv),
[Git Graph](https://marketplace.visualstudio.com/items?itemName=mhutchie.git-graph),
[Git Lens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens),
[Yaml](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml).

В упоминаемых папках и файлах `/path/to` условно обозначает локальную папку, которую вы выделили под проект.
Например, если на вашем компьютере это `/Users/me/projects/special-archive`, то `/path/to/some-folder` в инструкциях означает `/Users/me/projects/special-archive/some-folder`.

### Требования к системе

Для запуска скриптов подойдёт любой относительно современный компьютер с любой операционной системой (Linux, macOS, Windows).
Хватит 2-4 ГБ оперативной памяти и порядка 1 ГБ свободного места на диске.

### Подготовка к работе

Эти шаги достаточно выполнить один раз, даже если вы планируете сбор нескольких коллекций архива.

1.  Убедитесь, что на машине установлены [гит](https://git-scm.com/) (система контроля версий) и [нода](https://nodejs.org/ru/) (среда запуска скриптов).
    При установке ноды рекомендуется выбрать версию LTS.

    Команды для проверки установки:

    ```sh
    git --version
    ## покажет ≥ 2.30
    
    node --version
    ## покажет ≥ 16.0, < 17
    ```

1.  Установите последнюю версию [ярна](https://yarnpkg.com) (менеджера зависимостей):

    ```sh
    npm install --global yarn
    ```

    Команда для проверки установки:

    ```sh
    yarn --version
    ## покажет ≥ 1.22
    ```

1.  [Клонируйте](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository) этот репозиторий в папку `/path/to/tooling`.

    Если результат оказался в другой папке, например, `/path/to/special-archive-tooling` или `/path/to/archive/tooling`, то папку можно перенести.
    Связь с гитхабом при этом не потеряется.
    В качестве самопроверки убедитесь, что на вашем компьютере существует файл `/path/to/tooling/README.md`.

    Про `/path/to` написано выше.

1.  Откройте терминал, перейдите в папку `/path/to/tooling`:

    ```sh
    cd "/path/to/tooling"
    ```

    Название этой папки должно появиться слева от места ввода команды.

1.  Будучи в папке `/path/to/tooling`, установите зависимые библиотеки:

    ```sh
    yarn install
    ```

    Это займёт пару минут.

1.  Будучи в папке `/path/to/tooling`, создайте пустой файл `.env.local`:

    ```sh
    yarn exe scripts/ensure-dot-env-local.script.ts
    ```

    Запуск этой консольной команды помогает проверить общую работоспособность скриптов.
    Если возникла ошибка, следует заново пройтись по инструкции (видимо, что-то пропустили).

## Создании коллекции

Перед выполнением шагов в этом разделе вам надо получить доступ к непубличному репозиторию, в котором будут храниться данные.
Для этого свяжитесь с автором скриптов или кем-то из телеграм-чата [@ruarxivechat](https://t.me/ruarxivechat).
Вы должны быть зарегистрированным пользователем на гитхабе и сообщить свой ник.

После получения доступа:

1.  Создайте локальную папку `/path/to/data/collections`.

1.  Клонируйте созданную для вас ветку в папку `/path/to/data/collections/COLLECTION_NAME`.

    `COLLECTION_NAME` — это название коллекции (например, `region-pnz` или `topic-xyz`).
    Название папки соответствует названию ветки репозитория с данными (`collections/COLLECTION_NAME`).

1.  Откройте файл `/path/to/tooling/.env.local` как текстовый и укажите путь к коллекции архива.
    Это делается добавлением такой строчки:

    ```ini
    COLLECTION_DIR_PATH=../data/collections/COLLECTION_NAME
    ```

    Часть `COLLECTION_NAME` надо заменить на реальное название папки.

1.  Если коллекция архива новая (то есть ещё не начата кем-то другим), заполните файл `/path/to/data/collections/COLLECTION_NAME/collection-config.yml`.
    Шаблон этого файла уже будет создан до вас.
    Внутри — комментарии с подсказками.

1.  Откройте файл `/path/to/data/collections/COLLECTION_NAME/collection-config.yml` и уточните его содержимое.
    Укажите название и часовой пояс:

    ```yml
    name: Энская область
    description: Популярные паблики Энской области в ВК

    timeZone: MSK+2
    ```

    Указанный часовой пояс будет использоваться браузером во время скачивания всех страниц.
    Часовой пояс иногда влияет на время, которое показывает сервер.
    Примеры [часовых поясов России](https://ru.wikipedia.org/wiki/%D0%92%D1%80%D0%B5%D0%BC%D1%8F_%D0%B2_%D0%A0%D0%BE%D1%81%D1%81%D0%B8%D0%B8): `MSK` (Московское время), `MSK-1` (Калининград), `MSK+9` (Камчатка).

1.  Закоммитьте и запушьте изменения в файле `collection-config.yml` при помощи гита.

    Этот шаг упростит дальнейшую работу над территорий и обеспечит вас резервной копией.

## Регистрация веб-страниц в коллекции

1.  Введите адрес страницы, которую хотите зарегистрировать в коллекции.

    ```sh
    ## cmd.exe
    set URL_TO_REGISTER=https://vk.com/typical_ensk
    
    ## любой другой терминал
    export URL_TO_REGISTER=https://vk.com/typical_ensk
    ```

1.  Запустите скрипт для регистрации этой страницы:

    ```sh
    yarn exe scripts/web-pages/register-by-url.script.ts
    ```

    Повторите эти шаги для каждой страницы, которую хотите добавить.
    Метод пока не очень удобный — мы подумаем, как его улучшить.

## Работа с Wayback Machine

[Wayback Machine](https://ru.wikipedia.org/wiki/Wayback_Machine) — бесплатный онлайн-архив некоммерческой библиотеки «Архив Интернета».
Для нас это внешнее хранилище резервных копий релевантных веб-страниц.
Чисто в теории локально собранный архив может быть подделкой, поэтому синхронизация с международно признанным архивом интернета — что-то вроде похода к нотариусу.

1.  Получите список снимков в международном веб-архиве для зарегистрированных в коллекции страниц.

    ```sh
    yarn exe scripts/web-pages/wayback-machine/1-fetch-snapshot-infos.script.ts
    ```

1.  Запланируйте отправку заявок на новые снимки:

    ```sh
    yarn exe scripts/web-pages/wayback-machine/2-plan-submissions.script.ts
    ```

    Эта команда посмотрит на даты страниц в онлайн-архиве.
    Страницы, которые давно не загружались, будут отмечены как требующие новых снимков.

1.  Запустите отправку заявок на новые снимки:

    ```sh
    yarn exe scripts/web-pages/wayback-machine/3-attempt-planned-submissions.script.ts
    ```

    Эту команду можно запускать несколько раз.
    Успешные заявки не будут повторяться.

1.  Подождите пару часов — веб-архиву нужно время для создания новых снимков.

1.  Обновите список снимков в международном веб-архиве для зарегистрированных в коллекции страниц.

    ```sh
    yarn exe scripts/web-pages/wayback-machine/1-fetch-snapshot-lists.script.ts
    ```

<!--

## post-mvp

```sh
yarn exe scripts/collection/init.script.ts
```

```sh
yarn exe scripts/web-pages/capturing/1-plan-submissions.script.ts
yarn exe scripts/web-pages/capturing/2-attempt-planned-submissions.script.ts
yarn exe scripts/web-pages/capturing/3-extract-capture-infos.script.ts
yarn exe scripts/web-pages/capturing/4-extract-capture-info-combinations.script.ts
```

```sh
yarn exe scripts/web-pages/update-annotations-from-capture-info-combinations.script.ts
yarn exe scripts/web-pages/register-from-annotations.script.ts
```

1.  submit feeds to web archive (interval)

1.  get post snapshot

-->
