# Special archive

## MVP

## Регистрация веб-страниц в коллекции

1.  Введите адрес страницы, которую хотите зарегистрировать в коллекции.

    ```sh
    ## cmd.exe
    set URL_TO_REGISTER=https://vk.com/something
    
    ## любой другой терминал
    export URL_TO_REGISTER=https://vk.com/something
    ```

1.  Запустите скрипт для регистрации этой страницы:

    ```sh
    yarn exe scripts/web-pages/register-url.script.ts
    ```

## Работа с международным веб-архивом

1.  Получите список снапшотов в международном веб-архиве для зарегистрированных в коллекции страниц.

    ```sh
    yarn exe scripts/web-pages/internet-archive/1-fetch-snapshot-lists.script.ts
    ```

1.  Запланируйте отправку заявок на новые снапшоты:

    ```sh
    yarn exe scripts/web-pages/internet-archive/2-plan-submissions.script.ts
    ```

1.  Запустите отправку заявок на новые снапшоты:

    ```sh
    yarn exe scripts/web-pages/internet-archive/3-attempt-planned-submissions.script.ts
    ```

1.  Подождите пару часов — веб-архиву нужно время для создания новых снапшотов.

1.  Обновите список снапшотов в международном веб-архиве для зарегистрированных в коллекции страниц.

    ```sh
    yarn exe scripts/web-pages/internet-archive/1-fetch-snapshot-lists.script.ts
    ```

<!--

## post-mvp

```sh
yarn exe scripts/archive-collection/init.script.ts
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
