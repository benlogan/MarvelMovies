function loadMovieData(url, config, rScale, refreshGraph) {        
        d3.json(url, function(err, data) {
            $.fancybox.hideLoading();
            if(err) return $.fancybox("<p>Failed to load data.</p>");

            data.forEach(function(d, i) {
                d.type = 'movie';
                d.starNodes = {};
                d.characterNodes = {};
                d.displayname = d.name + (d.year ? ', ' + d.year : "");
                d.rating = d.rating && parseFloat(d.rating) ? parseFloat(d.rating) : 0 ;
                d.color = config.colors.movie;
                d.y = 0; d.x = 0;
                d.tooltip = [
                    { key: "displayname", url : d.url || "" },
                    { key: "rating", label: "Rating" }
                ];
                nodes.add(d);

                if(d.director && d.director.name) {
                    d.director.type = 'director';
                    d.director.rating = 0;
                    d.director.films = 0;
                    d.director.color = config.colors.director;
                    d.director.tooltip = [
                        {key: 'name', url: d.director.url},
                        {key: "rating", label: "Average Rating"}
                    ];
                    nodes.add(d.director);
                    edges.add(nodes.get(d.id), nodes.get(d.director.id));
                    d.director.rating = (d.director.rating*d.director.films+d.rating)/(d.director.films+1).toFixed(1);
                    d.director.films++;
                }
                d.stars.forEach(function(s){
                    s.type = 'star';
                    s.rating = 0;
                    s.color = config.colors.star;
                    s.films = 0;
                    s.tooltip = [
                        {key: 'name', url: s.url },
                        {key: "rating", label: "Average Rating"}
                    ];
                    nodes.add(s);
                    edges.add(nodes.get(d.id), nodes.get(s.id));
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
                        {key: 'name' , url: character.url},
                        {key: "films", label: "Found in movies"}
                    ];
                    nodes.add(character);
                    edges.add(nodes.get(d.id),nodes.get(character.id));
                    d.characterNodes[character.id] = nodes.get(character.id);
                    d.characterNodes[character.id].rating = (d.characterNodes[character.id].rating * d.characterNodes[character.id].films + d.rating)/(d.characterNodes[character.id].films+1).toFixed(1);
                    d.characterNodes[character.id].films++;
                });
            });

            // what is this doing?
            // adding the edges to represents links between movies based on overlapping actors/characters/director? : exactly.
            // We add only those movie edges that have some weight. 'w' here can be used as edge weight too.
            data.forEach(function(d, i) {
                if(!d.id) return console.error("missing id for movie", d.name);
                for(var j = i + 1; j < data.length; j++) {
                    if(!data[j].id) {
                        console.error("missing id for movie", data[j].name);
                        continue;
                    }
                    var w = 0;
                    if(d.director.id === data[j].director.id) w++;
                    d.stars.forEach(function(s1) {
                        data[j].stars.forEach(function(s2) {
                            if(s1.id === s2.id) w++;
                        });
                    });
                    d.characters.forEach(function(c1) {
                        data[j].characters.forEach(function(c2) {
                            if(c1.id === c2.id) w++;
                        });
                    });
                    if (w) {
                        edges.add(d, data[j]);
                    }
                }
            });

            // what is this doing? - Calculates domain for the scale that maps node rating to node circle size.
            // the config.minrating is used so that domain's min value is not zero. 0 causes division by 0 error later on.
            // * 3 is used because we want to have more larger range than domain to distinguish nodes on screen.
            var min = d3.min(nodes.getAll(), function(d){ return d.rating;}) * config.minrating,
                max = d3.max(nodes.getAll(), function(d){ return d.rating;}) * 3;
            rScale.domain([min, max]);

            force.nodes(nodes.getAll())
                 .links(edges.getAll())

            //refreshGraph();
        });
}

function flatten(root) {
var nodes = [];
      function traverse(node, depth) {
        if (node.children) {
          node.children.forEach(function(child) {
            child.parent = node;
            traverse(child, depth + 1);
          });
        }
        node.depth = depth;
        nodes.push(node);
      }
      traverse(root, 1);
      return nodes;
}
