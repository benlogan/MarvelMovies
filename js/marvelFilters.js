var filter = {
            disableAll: function() {
                gedges.each(function(d){ d.active = 0; });
                gnodes.each(function(d){ d.active = 0; });
            },
            enableAll: function() {
                gedges.each(function(d){ d.active = 1; });
                gnodes.each(function(d){ 
                    d.active = 1; 
                    d.zoom = 1;
                });
            },
            enableConnected: function(id, type) {
                gedges.each(function(d) {
                    if(!d.active) {
                        if(d.source.id === id && (type === "" || d.target.type === type)) {
                            d.target.active = 1;
                            d.active = 1;
                        } else if(d.target.id === id && (type === "" || d.source.type === type)) {
                            d.source.active = 1;
                            d.active = 1;
                        }
                    }
                });
            },
            enableType: function(type) {
                gedges.each(function(d) {
                    if(!d.active) {
                        /*
                        if(d.target.type === type) {
                            d.target.active = 1;
                            d.active = 1;
                        } else if(d.source.type === type) {
                            d.source.active = 1;
                            d.active = 1;
                        }*/
                        if((d.target.type === type && d.source.type === type) ||
                          (d.source.type === 'movie' && d.target.type === type)) {
                            d.target.active = 1;
                            d.source.active = 1;
                            d.active = 1;
                        }
                    }
                });
            },
            setOpacity: function() {
                gnodes.transition().duration(400).style('opacity', function(d){ return d.active ? d.hover || d.active : d.active; });
                gedges.transition().duration(400).style('opacity', function(d){ return d.active ? d.hover || d.active : d.active; });
            },
            setActiveStroke: function(activeNode, colour) {
                gnodes.style('stroke',function(d){
                    return activeNode && activeNode.id === d.id ? colour : '';
                }).style("stroke-width",function(d){
                    return activeNode && activeNode.id === d.id ? '3px' : '0px';
                });
            },
            layout: function(zoom, activeNode, rScale) {
                //config.zoom = arguments.length ? zoom || 1 : config.zoom;
                
                /*
                if(activeNode)
                    container.attr("transform", "translate("+(-activeNode.x*config.zoom)+","+(-activeNode.y*config.zoom)+")scale(" + config.zoom + ")");
                else
                    container.attr("transform", "translate(0,0)scale(" + config.zoom + ")");
                */
                gnodes.style('stroke',function(d){ return activeNode && d.id === activeNode.id ? config.colors.active : '' ;})
                      .style("stroke-width",function(d){ return activeNode && d.id === activeNode.id ? '3px' : '0x' ;});
                gnodes.selectAll("circle.bubble").transition().duration(500)
                    .attr("r", function(d) {
                        d.r;// = rScale(d.rating + 0.001); // what are we trying to do here, it's not a function!
                        return d.r * d.zoom * d.active; 
                    });
                filter.setOpacity();

                startForce(0.1);
            }
        };

        function applyFilters() {
            filter.disableAll();
            
            var type = $("input[name='link']:checked").val();
            
            // all by type!
            filter.enableType(type);
            
            // always enable movies (if we haven't already)!
            if(type !== 'movie') {
                filter.enableType('movie');
            }
            
            filter.layout(3);
        }