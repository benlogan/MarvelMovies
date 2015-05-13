        var tip = {
            getHtml: function (d) {
                var html = "<div class='tipcontent' style='color:" + d.color + "'>";
                if (!d.tooltip || !d.tooltip.length) {
                    return html + "<h4>" + d.name + (d.year ? ", " + d.year : "") + "</h4></div>";
                }
                for (var i = 0; i < d.tooltip.length; i++) {
                    var text = d.tooltip[i].url ? "<a href='" + d.tooltip[i].url + "' target='_blank'>" + d[d.tooltip[i].key] + "</a>" : d[d.tooltip[i].key];
                    if(d.tooltip[i].key==='name' || d.tooltip[i].key==='displayname') html += "<h4>" + text + "</h4>";
                    else if(d.tooltip[i].label)
                        html += "<span> " + d.tooltip[i].label + ":</span> " + text; 
                }
                html += "<div class='omdbinfo'><div class='ajaxloader'></span></div></div>";
                html += "</div>";
                return html;
            },
            show: function (d) {
                $("div#infohover").html(tip.getHtml(d,"Hovered")).show();
            },
            hide: function () {
                $("div#infohover").hide();
            },
            showActive: function (activeNode) {
                filter.setActiveStroke(activeNode);
                if(activeNode){
                    $("div#infoactive").html(tip.getHtml(activeNode,"Active")).show();
                    if(activeNode.type==='movie'){
                        $("div#infoactive").find(".omdbinfo .ajaxloader").fadeIn("fast");
                        $.ajax({
                            url : imdbApiUrl(activeNode),
                            jsonp : true,
                            before: function(){
                                $("div#infoactive").find(".omdbinfo .ajaxloader").fadeIn("fast");
                            },
                            complete: function(){
                                $("div#infoactive").find(".omdbinfo .ajaxloader").fadeOut("fast");
                            },
                            success: function(data){
                                if(data.Poster && data.Plot){
                                    var html = "<a href='" + activeNode.url + "' target='_blank'><img src = '" + movieImgUrl(activeNode) + "' width='100%' height='200px' style='min-height:200px' /></a><p>" + data.Plot + "</p>";
                                    $("div#infoactive").find(".omdbinfo").html(html);
                                }
                            }
                        });
                    }
                }
                else $("div#infoactive").hide();
            }
        };