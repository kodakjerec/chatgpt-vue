# original from
[https://github.com/lianginx/chatgpt-vue](https://github.com/lianginx/chatgpt-vue)
# chatgpt-vue

A simple chat dialogue using Vue3 + Typescript + Tailwind CSS framework, utilizing OpenAI’s gpt-3.5-turbo model API, supporting continuous dialogue(maximum 3072 tokens).

<img src="img/preview.jpg" width="300">

## Installation

```bash
npm i
npm run dev
```

or

```bash
yarn
yarn dev
```

finally：

```bash
VITE v3.2.5  ready in 294 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

# Starting Guide

1. Enter __Settings__ and import an API key.
2. Create a new chat and start chatting.
3. __Transcription__ can record your voice and translate it into the desired language.


# Chat Log

* Single click: View chat contents.  
* Trash can: Clear the chat.
# Features

1. This system uses the gpt-3.5-turbo model.  
2. All logs are stored locally in local-Storage.  
If you have connected with Google-account, you can easily synchronize your logs across different devices.
3. chat logs are limited to a maximum of 4096 tokens. If exceeded, chatGPT will display a prompt and you’ll need to create a new chat.

## License

This project is licensed under the [MIT](LICENSE) license.
