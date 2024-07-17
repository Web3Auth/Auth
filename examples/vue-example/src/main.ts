import "./tailwind.css";

import { createApp } from "vue";

import App from "./App.vue";
import createIcons from "./plugins/iconPlugin";

const app = createApp(App as any);

app.use(createIcons)

app.mount("#app");
