<template>
    <div class="ml-6">
        <p class="text-2xl font-bold mt-10">剛開始</p>
        <p>1. 先進入 <strong>Settings</strong> 匯入 API Key</p>
        <p>2. 新增一個對話，開始交談</p>

        <p class="text-2xl font-bold mt-10">對話紀錄</p>
        <ul>
            <li>點一下：進入對話內容</li>
            <li>點兩下：修改對話名稱，按下Enter生效</li>
            <li>垃圾桶：清除對話</li>
        </ul>

        <p class="text-2xl font-bold mt-10">特色</p>
        <ul class="ml-4" style="list-style-type: disc;">
            <li>所有紀錄皆存在於localStorage</li>
            <li>對話紀錄最多4096個token，超過chatGPT會提示無法送出，此時請重開新對話</li>
        </ul>
    </div>
</template>