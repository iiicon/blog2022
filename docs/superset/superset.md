# superset

`Superset` 是一款由 Airbnb 开源的“现代化的企业级 BI（商业智能） `web`应用程序”，其通过创建和分享 `dashboard`，为数据分析提供了轻量级的数据查询和可视化方案。
`Superset` 的前端主要用到了 `React` 和 `NVD3/D3`，而后端则基于 `Python` 的 `Flask` 框架和 `Pandas`、`SQLAlchemy` 等依赖库，主要提供了这几方面的功能：

- 集成数据查询功能，支持多种数据库，包括 `MySQL`、`PostgresSQL`、`Oracle`、`SQL Server`、`SQLite`、`SparkSQL` 等，并深度支持 `Druid`。
- 通过 `NVD3/D3` 预定义了多种可视化图表，满足大部分的数据展示功能。如果还有其他需求，也可以自开发更多的图表类型，或者嵌入其他的 `JavaScript` 图表库（如 `HighCharts`、`ECharts`）。
- 提供细粒度安全模型，可以在功能层面和数据层面进行访问控制。支持多种鉴权方式（如数据库、`OpenID`、`LDAP`、`OAuth`、`REMOTE_USER` 等）

## superset-frontend

`superset` 的前端部分用 `webpack` 单独管理

1. superset 通过 webpack 构建开发环境和打包，通过不同的入口，打包成不同的 chunk 和 bundle，在开发环境通过 webpack 的 manifest 建立各个包之间的联系
2. webpack 打包的文件放在 python 项目 superset 目录 `/superset/static/assets` 下，这也是 `dev-server` 对应的 `contentBase`, 也就是 `production` 模式下的 `publicPath`
3. 构建命令都在 `package.json` 的 `scripts` 字段中，前端在开发的时候先启动 `python` 服务，然后启动 `dev-server` 并可实时观察前端的修改

```json
{
  "dev": "webpack --mode=development --colors --debug --watch",
  "dev-server": "cross-env NODE_ENV=development BABEL_ENV=development node --max_old_space_size=4096 ./node_modules/webpack-dev-server/bin/webpack-dev-server.js --mode=development"
}
```

4.  最后打包生成的 `spa.xx.js` 就是前端的入口

```py
 def render_app_template(self) -> FlaskResponse:
    payload = {
        "user": bootstrap_user_data(g.user, include_perms=True),
        "common": common_bootstrap_payload(),
    }
    payload["isAdmin"] = True if "admin" == g.user.username else False
    return self.render_template(
        "superset/spa.html",
        entry="spa",
        bootstrap_data=json.dumps(
            payload, default=utils.pessimistic_json_iso_dttm_ser
        ),
    )
```

### 源码目录设计

`superset-frontend` 的源码都在 `src` 目录下 _（只需要关注主要逻辑）_

```md
src
├── addSlice # 添加图表组件
├── api # 接口
├── assets # 资源
├── chart # 单个图表
├── common # 公用的组件和 hooks
├── components # 基础组件
├── dashboard # 看板
├── datasource # 数据源的逻辑
├── filters # 默认的 filters
├── profile # 个人资料
├── explore # ExploreChartPanel 搜索的 panel 的逻辑
├── setup # 入口需要执行的逻辑
├── utils # 工具库
├── views # 各个页面
├── types # 公共类型
├── visualizations # 可视化图标组件
├── logger
├── middleware
├── CRUD
├── dataMak
├── messageToasts
├── modules
├── showSavedQuery
├── SqlLab
```

二次开发关注后面有注释的这些目录就足够，观察各个目录就可发现，作者把不同的功能分成不同模块，每个模块都是用 react 全家桶来管理，可读性和维护性都很不错。

```js
entry: {
    preamble: PREAMBLE,
    theme: path.join(APP_DIR, '/src/theme.ts'),
    menu: addPreamble('src/views/menu.tsx'),
    spa: addPreamble('/src/views/index.tsx'),
    addSlice: addPreamble('/src/addSlice/index.tsx'),
    explore: addPreamble('/src/explore/index.jsx'),
    sqllab: addPreamble('/src/SqlLab/index.tsx'),
    profile: addPreamble('/src/profile/index.tsx'),
    showSavedQuery: [path.join(APP_DIR, '/src/showSavedQuery/index.jsx')],
  },
```

这里通过多入口了解到 explore chart dashboard 这些是多个页面，这样设计也方便多人开发

### views

`APP.tsx` 是页面的 `layout` ，由 `menu` 和 各个页面组成，在非 `admin` 用户登录时，增加了一个 `sideMenu` 组件用于切换不同的看板，各个页面渲染就是切换不同的 dashboard
admin 和 非 admin 登录可视作管理系统后台和前台

### explore

入口渲染 `ExploreViewContainer` 组件，用来渲染带搜索的编辑图表的页面，并且把 `form_data` 都记录到 URL 上， 这一步是通过 `repalceState` 和 `pushState` 实现的，并且添加了 `popState` 的回调，用来执行对应的 `action`

```ts
useEffect(() => {
  const payload = { ...props.form_data };
  const longUrl = getExploreLongUrl(
    props.form_data,
    props.standalone ? URL_PARAMS.standalone.name : null,
    false
  );

  if (isReplace) {
    window.history.replaceState(payload, title, longUrl);
  } else {
    window.history.pushState(payload, title, longUrl);
  }
  window.addEventListener("popstate", handlePopstate);
  document.addEventListener("keydown", handleKeydown);
  return () => {
    window.removeEventListener("popstate", handlePopstate);
    document.removeEventListener("keydown", handleKeydown);
  };
}, []);
```

总体来说页面由三个 `DataSourcePanel` `ConnectedControlPanelsContainer` 和 `ExploreChartPanel` panel 组成
`DataSourcePanel` `就是左侧数据展示，ConnectedControlPanelsContainer` 就是渲染 `Control` 组件

```ts
const ControlComponent = typeof type === "string" ? controlMap[type] : type;
```

`Control` 组件会根据不同的 `type` 渲染不同的组件, 这里的组件可以直接用 `controlMap` 的十几种组件，也可以扩展自己需要的组件

`ExploreChartPanel` panel 部分由 `header` `panelBody` 和 `DataTablePane` 组成，panelBody 部分就是渲染各种图表组件

```tsx
const panelBody = useMemo(
  () => (
    <div className="panel-body" ref={chartPanelRef}>
      {renderChart()}
    </div>
  ),
  [chartPanelRef, renderChart]
);
```

最后经过数据转化，加载 `superChart` 组件找到响应的 `vizType` 的组件渲染

值得一提的是 `chartRenderer` 组件用 `ErrorBoundary` 包起来, 通过 `componentDidCatch` 把错误信息和堆栈信息显示在页面上，在开发中是一种不错的处理错误的方式

```js
 componentDidCatch(error, info) {
    if (this.props.onError) this.props.onError(error, info);
    this.setState({ error, info });
  }
```

### visualizations

这个目录下的都是各个可视化组件，所有的图表都在这里初始化，集合在 `MainPreset` 类里面

以 `JoyoGeneralTable` 为例，入口就是提供一个继承于 `ChartPlugin` 的类，其他的参数都通过构造函数的参数传入，这样便实现了一个新的组件模板

```js
export default class JoyoGeneralTable extends ChartPlugin {
  constructor() {
    super({
      loadChart: () => import("./JoyoGeneralTable"),
      metadata,
      transformProps,
      controlPanel,
      buildQuery,
    });
  }
}
```

`metadata` 是一些图表的元数据，用于在实例化图表或者其他的生命周期中使用
`transformProps` 是用于格式化每个实例获取到的数据，方便在组件中使用和展示数据
`controlPanel` 是搜索栏需要的配置，输出一个 config，在页面的实例化阶段根据不同的`controlPanelSections`类型渲染不同的搜索组件
`buildQuery` 是构建请求参数 `form_data` 的参数或者一些额外的参数

#### 自定义的组件是怎么加载的？

首先在入口页 `explore` 调用 `setupPlugins`

```js
export default function setupPlugins() {
  new MainPreset().register();
}
```

`MainPreset` 的 `register` 方法就是 继承自 `Preset`，这个方法就是把定义在 `plugin` 中组件执行 `register` 方法

```js
register() {
    this.plugins.forEach(plugin => {
      plugin.register();
    });
    return this;
  }
```

`register` 方法继承自 `ChartPlugin`, 逻辑就是执行各自 `Registry` 的 `registerValue` 方法

```js
register() {
    const key: string = this.config.key || isRequired('config.key');
    getChartMetadataRegistry().registerValue(key, this.metadata);
    getChartComponentRegistry().registerLoader(key, this.loadChart);
    getChartControlPanelRegistry().registerValue(key, this.controlPanel);
    getChartTransformPropsRegistry().registerLoader(
      key,
      this.loadTransformProps,
    );
    if (this.loadBuildQuery) {
      getChartBuildQueryRegistry().registerLoader(key, this.loadBuildQuery);
    }
    return this;
  }
```

这里 `getInstance` 这里单例是为了避免多次实例化，然后 `registerValue` 和 `registerLoader` 继承自 `Register`，把对应的属性对象保存到 `items` 上，然后执行 `notifyListeners` 派发更新

```js
class ChartMetadataRegistry extends Registry<ChartMetadata, ChartMetadata> {
  constructor() {
    super({ name: 'ChartMetadata', overwritePolicy: OverwritePolicy.WARN });
  }
}
const getInstance = makeSingleton(ChartMetadataRegistry);

registerValue(key: string, value: V) {
    const item = this.items[key];

    if (!item) {
      this.items[key] = { value };
      delete this.promises[key];
      this.notifyListeners([key]);
    }

    return this;
  }
```

```js
componentDidCatch(error, info) {
    if (this.props.onError) this.props.onError(error, info);
    this.setState({ error, info });
  }
```

这就是整个图表组件渲染的核心逻辑


### 怎么监测 controlPanel 数据的变化， trigger 是否查询

```ts
useEffect(() => {
    if (previousControls) {
      const hasDisplayControlChanged = changedControlKeys.some(
        key => props.controls[key].renderTrigger,
      );
      if (hasDisplayControlChanged) {
        reRenderChart();
      }
    }
  }, [props.controls, props.ownState]);
```

### url too lang
