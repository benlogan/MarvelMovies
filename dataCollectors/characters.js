/* * ************************************************************ 
 * 
 * Date: 9 Mar, 2015
 * version: 0.0.1
 * programmer: Shani Mahadeva <satyashani@gmail.com>
 * Description:   
 * Javascript file characters.js
 * *************************************************************** */

var movies = require("../contents/data/movieslist_2.json");
var pg = require("webpage");
var page = pg.create();
var jq = "../contents/js/jquery-1.10.1.min.js";
var fs = require("fs");
var current = 0;


page.onConsoleMessage = function(msg) {
    console.log('PAGE MESSAGE:',msg);
};
var save = function(){
    fs.write("movies.json",JSON.stringify(movies),'w');
    phantom.exit();
};

var scrape = function(i){
    if(i>=movies.length){
        save();
        return console.log("Completed");
    }
    page.open(movies[i].url,function(stat){
        if(!stat==='success'){
            console.log("failed to open page for movie",movies[i].name,movies[i].url);
            scrape(i+1);
        }else{
            page.injectJs(jq);
            movies[i].characters = page.evaluate(function(){
                var res = [],ids = [];
                if(!$("td.character").size()) return [];
//                console.log('characters in page',$("td.character").size());
                $("td.character").each(function(){
                    var links = $(this).find('a');
                    links.each(function(){  
                        var a = $(this)
                        if(a.text()) {
                            var href = a.attr("href");
                            var node = {
                                url: href,
                                imdbid: href.match(/ch\d+/) ? href.match(/ch\d+/)[0] : "",
                                name : a.text()
                            };
                            if(node.imdbid && ids.indexOf(node.imdbid) === -1){
                                res.push(node);
                                ids.push(node.imdbid);
                            }
                        }
                    });
                });
                return res;
            });
            console.log("Movie",movies[i].name,"has",movies[i].characters.length,'charactes');
            scrape(i+1);
        }
    });
};
scrape(0);