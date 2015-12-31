/*
 spa.js
 Root namespace styles
 */
/*jslint     browser:true,continue:true,
 devel:true,indent:2,maxerr:50,
 newcap:true,nomen:true,plusplus:true,
 regexp:true,sloppy:true,vars:true,
 white:true
 */

var spa = (function(){
    /**/
    var initModule = function( $container ){
       spa.shell.initModule($container);
    };
    return { initModule:initModule };
}());
