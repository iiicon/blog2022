module.exports = {
  title: "blog",
  description: "new blog generation",
  theme: "reco",
  locales: {
    "/": {
      lang: "zh-CN",
    },
  },
  themeConfig: {
    subSidebar: "auto",
    nav: [
      { text: "首页", link: "/" },
      {
        text: "GerritV 的博客",
        items: [{ text: "Github", link: "https://github.com/iiicon" }],
      },
    ],
    sidebar: [
      {
        title: "react",
        path: "/react/react",
        collapsable: false, // 不折叠
        children: [{ title: "react源码阅读", path: "/react/react" }],
      },
      {
        title: "vue",
        path: "/vue/lts",
        collapsable: false,
        children: [{ title: "js最长递增子序列", path: "/vue/lts" }],
      },
      {
        title: "superset",
        path: "/superset/superset",
        collapsable: false,
        children: [
          { title: "superset二次开发笔记", path: "/superset/superset" },
        ],
      },
    ],
  },
  base: "/blog2022/",
};
