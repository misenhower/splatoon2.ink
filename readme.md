# splatoon2.ink

## Development

```shell
yarn serve
```

## Production

```shell
yarn build
```

Or via Docker:

```shell
docker-compose run --rm app yarn build
```

## Update SplatNet Data

```shell
yarn splatnet
```

On a schedule via Docker:

```shell
docker-compose up -d app
```
