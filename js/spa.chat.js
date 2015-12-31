/**
 * spa.chat.js
 * Created by 柏帅 on 2015/12/31.
 */

/*
* jslint          browser : true, continue :true,
* devel   : true, indent  : 2,    maxerr   :50,
* newcap  : true, nomen   : true,plusplus  :true,
* regexp  : true,sloppy   : vars           :false,
* white   : true
* */

spa.chat = (function () {
    //将聊天模块的HTML模板保存在configMap中
    var configMap = {
        main_html : String()
        + '<div style="padding: 1em; color: #fff;">'
            + 'Say hello to chat'
        + '</div>',
        settable_map : {}
    },
    stateMap  = { $container : null},
    jqueryMap = {},
    setJqueryMap, configModule, initModule;

    setJqueryMap = function () {
        var $container = stateMap.$container;
        jqueryMap = { $container : $container };
    };
    //创建configModule方法，每当功能模块设置setting时调用
    configModule = function ( input_map ) {
        spa.util.setConfigMap({
            input_map    : input_map,
            settable_map : configMap.settable_map,
            config_map   : configMap
        });
        return true;
    };
    //添加initModule方法，用于执行模块
    initModule = function ( $container ) {
        $container.html( configMap.main_html );//使用html模板填充聊天滑块容器
        stateMap.$container = $container;
        setJqueryMap();
        return true;
    };
    //到处模板方法，这两个方法几乎是所有功能模块的标配方法
    return {
        configModule : configModule,
        initModule   : initModule
    };
}());