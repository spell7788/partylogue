# Partylogue

Partylogue is a web-chat app, built to give an opportunity to chat with people on different fun topics.

<img src="https://user-images.githubusercontent.com/20142390/80628753-861da180-8a5a-11ea-8e32-e6289cc6f2dd.jpg" width="30%"></img> <img src="https://user-images.githubusercontent.com/20142390/80628766-89189200-8a5a-11ea-8ca0-48755ee61536.jpg" width="30%"></img>

## Prerequisites

* [docker-compose](https://docs.docker.com/compose/install/)

## Installation

Clone the repository:

`git clone https://github.com/hqrrylyu/partylogue.git`

## Usage

### Provide environment variables:

#### Server

`./server/.env.development` or `./server/.env.production`

```
# at least 32 bytes string
JWT_SECRET

# free length string
OBTAIN_ADMIN_CODE
```

See other server variables in `./server/src/config.ts`

#### Client

`./client/.env.development` or `./client/.env.production`

```
# socket.io connection url string
VUE_APP_CONNECTION=https://api.example.com
```

See other client variables `./client/.env`

### Run the stack:

`docker-compose up`

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
