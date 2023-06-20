<template>
    <div class="ml-6">
        <p class="text-2xl font-bold mt-10">Starting Guide</p>
        <p>1. Enter <span class="text-blue-500" @click="goTo('settings')">Settings</span> and import an API key.</p>
        <p>2. Create a new chat and start chatting.</p>
        <p>3. <span class="text-blue-500" @click="goTo('transcription')">Transcription</span> can record your voice and translate it into the desired language.</p>

        <p class="text-2xl font-bold mt-10">Chat List</p>
        <ul>
            <li>Single click: View chat contents.</li>
            <li>Trash can: Clear the chat.</li>
            <ul class="ml-4">
                <p class="text-xl font-bold">Within the chat</p>
                <li><edit theme="outline" size="20" fill="#000"/>: change it's name.</li>
                <li><voice-one theme="outline" size="20" fill="#000"/>:Play sound.</li>
                <li><copy theme="outline" size="20" fill="#000"/>:Copy content</li>
                <li><delete theme="outline" size="20" fill="#000"/>:Delete the specified content.</li>
            </ul>
        </ul>

        <p class="text-2xl font-bold mt-10">Features</p>
        <ul class="ml-4" style="list-style-type: disc;">
            <li>This system uses the gpt-3.5-turbo model.</li>
            <li>All logs are stored locally in localStorage. If you connected with Google-account, we will remove localStorage.</li>
            <li>Chat logs are limited to a maximum of 4096 tokens. If exceeded, chatGPT will display a prompt and you’ll need to create a new chat.</li>
            <li>Transcription uses openAI's "whisper-1" to recording and translate your text.</li>
        </ul>
    </div>
</template>
<script lang="ts">
import { Copy, Delete, Edit, VoiceOne } from "@icon-park/vue-next";

export default {
    name: 'home',
    components: {
        Copy, Delete, Edit, VoiceOne
    },
    methods: {
        goTo(destination:string) {
            this.$emit('fromClick', destination);
        }
    }
}
</script>