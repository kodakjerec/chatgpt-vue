<template>
    <div class="ml-6">
        <p class="text-2xl font-bold mt-10">Starting Guide</p>
        <p>1. Enter  <router-link to="/settings"><span class="text-blue-500">Settings</span></router-link> and import an API key.</p>
        <p>2. Create a new conversation and start chatting.</p>

        <p class="text-2xl font-bold mt-10">Conversation Log</p>
        <ul>
            <li>Single click: View conversation contents.</li>
            <li>Double click: Rename the conversation (leave input to save).</li>
            <li>Trash can: Clear the conversation.</li>
        </ul>

        <p class="text-2xl font-bold mt-10">Features</p>
        <ul class="ml-4" style="list-style-type: disc;">
            <li>This system uses the gpt-3.5-turbo model.</li>
            <li>All logs are stored locally in localStorage.</li>
            <li>Conversation logs are limited to a maximum of 4096 tokens. If exceeded, chatGPT will display a prompt and you’ll need to create a new conversation.</li>
        </ul>
    </div>
</template>