/* * ************************************************************ 
 * 
 * Date: 21 Jan, 2015
 * version: 0.0.1
 * programmer: Shani Mahadeva <satyashani@gmail.com>
 * Description:   
 * Javascript file graphPlugins.js
 * *************************************************************** */

String.prototype.ucwords = function(){
	return this.replace(/(?:^|\s)\S/g,function(v){return v.toUpperCase();});
};
String.prototype.ucfirst = function(){
	return this.replace(/(^[a-z])/,function(v){return v.toUpperCase();});
};
String.prototype.lcfirst = function(){
	return this.replace(/(^[A-Z])/,function(v){return v.toLowerCase();});
};
String.prototype.camelCaseToWords = function(){
	return this.split(/(?=[A-Z])/).join(" ");
};
String.prototype.Us2Space = function(){
	return this.replace(/_/g," ");
};
String.prototype.short = function(len){
    return (this.length> (len || 30) ? this.substr(0,(len || 30))+".." : this).toString();
};
var graphPlugins = {
    forceGraph : function(){
        var selector = '#grapharea';
        var div = d3.select(selector), $div = $(selector);
        var config = {
            textColor: div.attr("data-textcolor") || 'black',
            rmin: parseInt(div.attr("data-rmin")) || 2, rmax : parseInt(div.attr("data-rmax")) || 10,
            w : $div.width(),h : $div.height(),minrating: 0.01,
            linkDistance: 10, linkStrength: 0.1,
            zoom: 1.0, zoomMin: 0.8, zoomMax: 8.0, zoomStep: 0.2,
            colors: { movie: 'orange',director: 'magenta',star: 'blue',character: '#15ff00', active: 'red', hover: 'cyan' }
        };
        var imgbApiUrl = function(node){
            return "http://www.omdbapi.com/?i="+node.imdbid+"&plot=short&r=json";
        };
        var rScale = d3.scale.sqrt().range([config.rmin,config.rmax]);
        var url = div.attr("data-url");
        var svg = div.select('svg');
        svg.attr("width",config.w);
        svg.attr("height",config.h);
        var gnodes = svg.selectAll("g.node"), gedges = svg.selectAll("line.edge"),activeNode = null;
        
        var tip = {
            getHtml: function(d){
                var html = "<div class='tipcontent' style='color:"+d.color+"'>";
                if(!d.tooltip || !d.tooltip.length) return html+"<h4>"+d.name+"</h4></div>";
                for(var i=0;i<d.tooltip.length;i++){
                    var text = d.tooltip[i].url ? "<a href='"+d.tooltip[i].url+"' target='_blank'>"+d[d.tooltip[i].key]+"</a>" : d[d.tooltip[i].key];
                    if(d.tooltip[i].key==='name') html += "<h4>"+text+"</h4>";
                    else if(d.tooltip[i].label)
                        html += "<span> "+d.tooltip[i].label+":</span> " + text; 
                }
                html += "<div class='omdbinfo'><div class='ajaxloader'></span></div></div>";
                html += "</div>";
                return html;
            },
            show: function(d){
                $("div#infohover").html(tip.getHtml(d,"Hovered")).show();
            },
            hide: function(){
                $("div#infohover").hide();
            },
            showActive: function(){
                filter.setActiveStroke();
                if(activeNode){
                    $("div#infoactive").html(tip.getHtml(activeNode,"Active")).show();
                    if(activeNode.type==='movie'){
                        $("div#infoactive").find(".omdbinfo .ajaxloader").fadeIn("fast");
                        $.ajax({
                            url : imgbApiUrl(activeNode),
                            jsonp : true,
                            before: function(){
                                $("div#infoactive").find(".omdbinfo .ajaxloader").fadeIn("fast");
                            },
                            complete: function(){
                                $("div#infoactive").find(".omdbinfo .ajaxloader").fadeOut("fast");
                            },
                            success: function(res){
                                var data = JSON.parse(res);
                                var html = "<a href='"+activeNode.url+"' target='_blank'><img src = '"+data.Poster+"' width='100%' height='200px' style='min-height:200px' /></a><p>"+data.Plot+"</p>";
                                $("div#infoactive").find(".omdbinfo").html(html);
                            }
                        });
                    }
                }
                else $("div#infoactive").hide();
            }
        };
        
        var nodes = {
            keys: [],
            list: [],
            makeKey : function(d){
                return d.type+"_"+d.name.toLowerCase().replace(/ /g,"_");
            },
            exists: function(data){
                return this.keys.indexOf(this.makeKey(data)) > -1;
            },
            add: function(data){
                if(!this.exists(data)){
                    data.id = this.makeKey(data);
                    data.zoom = 1;
                    data.active = 1;
                    data.hover = 0;
                    this.keys.push(data.id);
                    this.list.push(data);
                }else data.id = this.makeKey(data);
            },
            get: function(name,type){
                var key = arguments.length === 2 ? this.makeKey({name: name,type: type}) : name;
                for(var i=0;i<this.list.length;i++){
                    if(key === this.list[i].id) return this.list[i];
                }
                return null;
            },
            getAll: function(){ return this.list;}
        };
        var edges = {
            keys: [],
            list: [],
            makeKey : function(s,d){
                return s.id+":"+d.id;
            },
            exists: function(s,d){
                return this.keys.indexOf(this.makeKey(s,d)) > -1;
            },
            add: function(s,d){
                if(!this.exists(s,d)){
                    var e = this.makeKey(s,d);
                    this.keys.push(e);
                    this.list.push({
                        source: s, target: d, id: e, active: 1, hover: 0
                    });
                }
            },
            get: function(s,d){
                var key = this.makeKey(s,d);
                for(var i=0;i<this.list.length;i++){
                    if(key === this.list[i].id) return this.list[i];
                }
                return null;
            },
            getAll: function(){ return this.list;}
        };
        
        var filter = {
            disableAll: function(){
                gedges.each(function(d){ d.active = 0; });
                gnodes.each(function(d){ d.active = 0; });
            },
            enableAll : function(){
                gedges.each(function(d){ d.active = 1; });
                gnodes.each(function(d){ 
                    d.active = 1; 
                    d.zoom = 1;
                });
            },
            enableConnected: function(id,type){
                gedges.each(function(d){
                    if(!d.active){
                        if(d.source.id===id && (type === "" || d.target.type === type)){
                            d.target.active = 1;
                            d.active = 1;
                        }else if(d.target.id===id && (type === "" || d.source.type === type)){
                            d.source.active = 1;
                            d.active = 1;
                        }
                    }
                });
            },
            enableType: function(type){
                gedges.each(function(d){
                    if(!d.active){
                        if(d.target.type === type){
                            d.target.active = 1;
                            d.active = 1;
                        }else if(d.source.type === type){
                            d.source.active = 1;
                            d.active = 1;
                        }
                    }
                });
            },
            setOpacity: function(){
                gnodes.transition().duration(400).style('opacity',function(d){ return d.active ? d.hover || d.active : d.active; });
                gedges.transition().duration(400).style('opacity',function(d){ return d.active ? d.hover || d.active : d.active; });
            },
            setActiveStroke: function(){
                gnodes.style('stroke',function(d){
                    return activeNode && activeNode.id === d.id ? config.colors.active : '';
                }).style("stroke-width",function(d){
                    return activeNode && activeNode.id === d.id ? '3px' : '0px';
                });
            },
            layout: function(zoom){
                config.zoom = arguments.length ? zoom || 1 : config.zoom;
                gnodes.style('stroke',function(d){ return activeNode && d.id === activeNode.id ? config.colors.active : '' ;})
                      .style("stroke-width",function(d){ return activeNode && d.id === activeNode.id ? '3px' : '0x' ;});
                gnodes.selectAll("circle.bubble").transition().duration(500)
                    .attr("r",function(d){
                        d.r = rScale(d.rating+0.001);
                        return d.r * d.zoom * d.active; 
                    });
                filter.setOpacity();
                force.alpha(0.1).start();
            }
        };
        
        var tick = function(e){
            if(force.alpha()<0.025) force.alpha(0);
            gnodes.attr("transform",function(d){ return "translate("+d.x+","+d.y+")"; });
            gedges.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) {  return d.target.y; });
//                .attr("d",function(d){
//                    return "M"+d.source.x+" "+d.source.y+
//                           " C "+d.source.x+" "+(d.source.y+d.target.y)/2+", "+
//                           d.target.x+" "+(d.source.y+d.target.y)/2+", "+
//                           d.target.x+" "+d.target.y;});;
        };
        
        var force = d3.layout.force()
            .linkStrength(function(d){
                return config.linkStrength/d.zoom/config.zoom;
            }).linkDistance(function(d){
                return config.linkDistance*config.zoom*config.zoom;
            }).charge(function(d){
                return -30*(d.zoom+config.minrating)*d.active;
            }).size([config.w-2*config.rmax,config.h-2*config.rmax])
            .on("tick", tick).on("end", tick);

        var selectMovie = function(fc){
            activeNode = fc;
            var active = $("select#linkparam").val();
            filter.disableAll();
            fc.zoom = 2;
            filter.enableConnected(fc.id,active);
            if(!active || active==='star'){
                for(var s in fc.starNodes){
                    filter.enableConnected(fc.starNodes[s].id,'movie');
                }
            }
            if(!active || active==='character'){
                for(var s in fc.characterNodes){
                    filter.enableConnected(fc.characterNodes[s].id,'movie');
                }
            }
            if(!active || active==='director'){
                for(var s in fc.starNodes){
                    filter.enableConnected(fc.director.id,'movie');
                }
            }
            fc.active = 1;
            filter.layout(3);
        };
        
        var updateMovie = function(){
            if($("input#movie").val())
                selectMovie(nodes.get($("input#movie").val(),'movie'));
        };
        
        
        //Page Events
        $("input#movie").keyup(function(e){
            e.preventDefault();
            e.stopPropagation();
            var code = e.keyCode || e.which;
            if(code === 13 && nodes.get($(this).val(),'movie')){
                updateMovie();
            }
        });
        $("select#linkparam").change(updateMovie);
        $("a#clear").click(function(e){
            e.preventDefault();
            filter.enableAll();
            activeNode = null;
            tip.showActive();
            config.zoom = 1;
            $("input#movie").val("");
            $("select#linkparam").val("");
            filter.layout(1);
        });
        $("body").keyup(function(e){
            var code = e.keyCode || e.which;
            if(code === 27){
                if(activeNode){
                    activeNode = null;
                    edgeHighlight(activeNode,false);
                }
                tip.showActive();
            }
        });
        
        //Mouse zoom/drag events
        var mousedown = false,mousePos = {
            down: {x: config.w/2,y: config.h/2},curr: {x: config.w/2,y: config.h/2}
        };
        $div.mousewheel(function(e,s){
            e.preventDefault();
            e.stopPropagation();
            var off = $(this).offset();
            if(s > 0) zoom(1,e.pageX-off.left,e.pageY-off.top);
            else zoom(-1,e.pageX-off.left,e.pageY-off.top);
        }).mouseup(function(){
            mousedown=false;
            $(this).css({"cursor":"auto"});
        }).mousedown(function(e){
            mousedown=true;
            var off = $(this).offset();
            mousePos.down.x=e.pageX-off.left;
            mousePos.down.y=e.pageY-off.top;
            $(this).css({"cursor":"move"});
        }).mousemove(function(e){
            var off = $(this).offset();
            mousePos.curr.x=e.pageX-off.left;
            mousePos.curr.y=e.pageY-off.top;
            if(mousedown){
                var x = mousePos.curr.x-mousePos.down.x, y = mousePos.curr.y-mousePos.down.y;
                drag(x,y);
                mousePos.down.x = mousePos.curr.x;
                mousePos.down.y = mousePos.curr.y;
            }
        });
        
        var edgeHighlight = function(d,highlight){
            if(highlight){
                gedges.each(function(de){
                    de.hover = de.source.id === d.id || de.target.id === d.id ? 1 : 0.1;
                    de.source.hover = Math.max(de.source.hover,de.hover);
                    de.target.hover = Math.max(de.target.hover,de.hover);
                });
                gnodes.style('stroke',function(dn){
                    return activeNode && activeNode.id === dn.id ? config.colors.active : ( dn.id === d.id ? config.colors.hover : '');
                }).style("stroke-width",function(dn){
                    return activeNode && activeNode.id === dn.id ? '3px' : ( dn.id === d.id ? '3px' : '');
                });
            }
            else{
                gedges.each(function(de){
                    de.hover = 0;
                    de.source.hover = 0;
                    de.target.hover = 0;
                });
                filter.setActiveStroke();
            }
            filter.setOpacity();
        };
        
        //Creates graph afresh from data available in force
        var refreshGraph = function(){
            //Render edges
            gedges = gedges.data(force.links()).enter().append('line')
                .attr("class", "edge")
                .style("stroke-width", 1).attr("fill",function(d){
                    return d.target.color;
                }).attr("stroke",function(d){return d.target.color || 'grey';})
//                .attr("d",function(d){
//                    return "M"+d.source.x+" "+d.source.y+
//                           " C "+(0.9*d.source.x+0.1*d.target.x)+" "+(0.9*d.source.y+0.1*d.target.y)+", "+
//                           (0.9*d.target.x+0.1*d.source.x)+" "+(0.9*d.target.y+0.1*d.source.y)+", "+
//                           d.target.x+" "+d.target.y;});
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) {  return d.target.y; });;
        
            //Render nodes
            gnodes = gnodes.data(force.nodes()).enter().append('g').attr("class","node").each(function(d){
                d.x = Math.random()*config.w;
                d.y = Math.random()*config.h;
            }).attr("transform",function(d){ return "translate("+d.x+","+d.y+")"; });
            gnodes.selectAll('circle').remove();
            
            //Render Circles
            var circle = gnodes.append('circle').attr("class","bubble");
            circle.attr("fill",function(d){ return d.color; })
                .attr('r',0).attr("stroke-width", 2)
                .transition().duration(500).attr("r",function(d){
                    d.r = rScale(d.rating);
                    return d.r*d.zoom; 
                });
//            circle.call(tip);
            circle.on("mouseover",function(d){
                tip.hide();
                tip.show(d);
                edgeHighlight(d,true);
            }).on("mouseout",function(d){
                edgeHighlight(d,false);
                tip.hide();
                if(activeNode) edgeHighlight(activeNode,true);
//                window.setTimeout(function(){
//                    if($("div.d3-tip").text().indexOf(d.name)>-1) tip.hide(d);
//                },3000);
            }).on("click",function(d){
                if(activeNode && activeNode.id === d.id){
                    activeNode = null;
                    edgeHighlight(d,false);
                }else{
                    activeNode = d;
                    edgeHighlight(d,true);
                }
                tip.showActive();
            }).on("dblclick",function(d){
                var type = $("select#linkparam").val();
                filter.enableConnected(d.id,type);
                filter.layout();
            });
            
            $('body').click(function(e){
                if(e.target.tagName!=='circle'){
                    activeNode = null;
                    edgeHighlight(null,false);
                }
                tip.showActive();
            });
            
            gnodes.selectAll('text').remove();
            gnodes.call(force.drag);
            force.alpha(0.1).start();
        };
        
        var zoom = function(factor,mx,my){
//            console.log(config.zoom, config.zoomMax,config.zoomMin,factor,force.alpha());
            if( force.alpha()>0 || !factor ||
                    (config.zoom >= config.zoomMax && factor > 0 ) ||
                    (config.zoom <= config.zoomMin && factor < 0 )
                ) return false;
        
            var zprev = config.zoom;
            config.zoom += ( factor*config.zoomStep ) / Math.abs(factor);
//            $(config.slider).slider({"value":config.zoom});
            var f = config.zoom / zprev, x = mx || config.w/2, y = my || config.h/2;
            gnodes.selectAll('circle').attr("r",function(d){
                d.r *= f;
                return d.r*d.zoom;
            });
            gnodes.attr("transform",function(d){ 
                d.x = x+f*(d.x-x);
                d.y = y+f*(d.y-y); 
                return "translate("+d.x+","+d.y+")"; 
            });
            gedges.attr("x1", function(d) { 
                    return d.source.x;
                }).attr("y1", function(d) {
                    return d.source.y;
                }).attr("x2", function(d) {
                    return d.target.x;
                }).attr("y2", function(d) { 
                    return d.target.y;
                });
            return true;
        };
        
        var drag = function(x,y){
            if(force.alpha()>0) return;
            gnodes.attr("transform",function(d){ 
                d.x += x;
                d.y += y; 
                return "translate("+d.x+","+d.y+")"; 
            });
            gedges.attr("x1", function(d) { 
                return d.source.x;
            }).attr("y1", function(d) {
                return d.source.y;
            }).attr("x2", function(d) {
                return d.target.x;
            }).attr("y2", function(d) { 
                return d.target.y;
            });
            return true;
        };
        
        //Load Data
        $.fancybox.showLoading();
        d3.json(url,function(err,data){
            $.fancybox.hideLoading();
            if(err) return $.fancybox("<p>Failed to load data.</p>");
            data.forEach(function(d,i){
                d.type = 'movie';
                d.starNodes = {};
                d.characterNodes = {};
                d.rating = d.rating && parseInt(d.rating) ? parseInt(d.rating) : 0 ;
                d.color = config.colors.movie;
                d.y = 0; d.x = 0;
                d.tooltip = [
                    { key: "name",url : d.url || "" },
                    {key: "rating", label: "Rating"}
                ];
                nodes.add(d);
                if(d.director && d.director.name){
                    d.director.type = 'director';
                    d.director.rating = 0;
                    d.director.films = 0;
                    d.director.color = config.colors.director;
                    d.director.tooltip = [
                        {key: 'name' },
                        {key: "rating", label: "Average Rating"}
                    ];
                    nodes.add(d.director);
                    edges.add(nodes.get(d.id),nodes.get(d.director.id));
                    d.director.rating = (d.director.rating*d.director.films+d.rating)/(d.director.films+1).toFixed(1);
                    d.director.films++;
                }
                d.stars.forEach(function(s){
                    s.type = 'star';
                    s.rating = 0;
                    s.color = config.colors.star;
                    s.films = 0;
                    s.tooltip = [
                        {key: 'name' },
                        {key: "rating", label: "Average Rating"}
                    ];
                    nodes.add(s);
                    edges.add(nodes.get(d.id),nodes.get(s.id));
                    d.starNodes[s.id] = s;
                    d.starNodes[s.id].rating = (d.starNodes[s.id].rating * d.starNodes[s.id].films + d.rating)/(d.starNodes[s.id].films+1).toFixed(1);
                    d.starNodes[s.id].films++;
                });
                d.characters.forEach(function(character){
                    character.type = 'character';
                    character.rating = 0;
                    character.color = config.colors.character;
                    character.films = 0;
                    character.tooltip = [
                        {key: 'name' },
                        {key: "films", label: "Found in movies"}
                    ];
                    nodes.add(character);
                    edges.add(nodes.get(d.id),nodes.get(character.id));
                    d.characterNodes[character.id] = nodes.get(character.id);
                    d.characterNodes[character.id].rating = (d.characterNodes[character.id].rating * d.characterNodes[character.id].films + d.rating)/(d.characterNodes[character.id].films+1).toFixed(1);
                    d.characterNodes[character.id].films++;
                });
            });
            data.forEach(function(d,i){
                if(!d.id) return console.error("missing id for movie",d.name);
                for(var j=i+1;j<data.length;j++){
                    if(!data[j].id){
                        console.error("missing id for movie",data[j].name);
                        continue;
                    }
                    var w = 0;
                    if(d.director.id === data[j].director.id) w++;
                    d.stars.forEach(function(s1){
                        data[j].stars.forEach(function(s2){
                            if(s1.id === s2.id) w++;
                        });
                    });
                    d.characters.forEach(function(c1){
                        data[j].characters.forEach(function(c2){
                            if(c1.id === c2.id) w++;
                        });
                    });
                    if(w){
                        edges.add(d,data[j]);
                    }
                }
            });
            var min = d3.min(nodes.getAll(),function(d){ return d.rating;})*config.minrating,
                max = d3.max(nodes.getAll(),function(d){ return d.rating;})*3;
                rScale.domain([min, max]);
            force.nodes(nodes.getAll()).links(edges.getAll())
                .linkStrength(0.1)
                .friction(0.9)
                .gravity(0.25)
                .theta(0.8);
            refreshGraph();
        });
        
        addSuggester("input#movie",function(term){
            var res = [];
            nodes.getAll().forEach(function(n){
                if(n.type==='movie' && n.name.toLowerCase().indexOf(term.toLowerCase())>-1) res.push(n.name);
            });
            return res;
        },updateMovie);
    }
};

$(document).ready(function(){
    graphPlugins.forceGraph();
    $("form#graphfilter").submit(function(e){
        e.preventDefault();
    });
});