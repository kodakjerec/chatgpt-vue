<template>
    <div class="bg-white w-full overflow-y-auto max-h-screen">
        <div class="bg-gray-100 h-full w-full">
            <div class="py-4 bg-gray-100 w-full h-10"></div>
            <!-- upload -->
            <div class="w-full">
                <div class="flex flex-col">
                    <input type="file" ref="fileInput" @change="handleFileSelect">
                    <div
                    class="border border-dashed border-blue-500 p-20 text-center"
                    @dragover.prevent
                    @drop="handleDrop"
                    @dragenter="isDragging = true"
                    @dragleave="isDragging = false"
                    :class="{ 'dragging': isDragging }"
                    >
                    <p>Drag and drop files here</p>
                    <p>The audio file to translate, in one of these formats: mp3, mp4, mpeg, mpga, m4a, wav, or webm.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { files, fileUpload } from "@/libs/gpt";

interface fileDetail {
    id: string,
    object: string,
    bytes: number,
    created_at: number,
    filename: string,
    purpose: string
}
export default {
    name: 'translation',
    data() {
        return {
            prompt: "" as string,
            isDragging: false as boolean
        }
    },
    mounted() {
        this.filelist();
    },
    methods: {
        async filelist() {
            let response:any = await files();
            this.fileList = response.data;
        },
        handleFileSelect(event: Event) {
            const file = (event.target as HTMLInputElement).files[0];
            this.uploadFile(file);
        },
        handleDrop(event: DragEvent) {
            event.preventDefault();
            this.isDragging = false;
            const file = event.dataTransfer?.files[0];
            if (file) {
            this.uploadFile(file);
            }
        },
        async uploadFile(file:File) {
            let response = await fileUpload(file, this.prompt)
        }
    }

}
</script>

<style scoped>
.dragging {
  background-color: #eee;
}
</style>