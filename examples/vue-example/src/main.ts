import "./tailwind.css";

import { Component, createApp } from "vue";

import App from "./App.vue";
import createIcons from "./plugins/iconPlugin";

const app = createApp(App as unknown as Component);

app.use(createIcons);

app.mount("#app");
