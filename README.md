# MarvelMovies
A visualisation showing the connections between all Marvel movies.

Playable Demo;
http://benlogan1981.github.io/MarvelMovies/

## Data Format

Data is json array of movies containing movie attributes. Each movie also contains array
of stars, director, characters of the movie. Movie nodes are added as is, then star, director
and character nodes are added for each movie. Nodes are not identified by IMDB id but by
their name and type(star,movie,director,character).

## Integration
Check index.html to view how graphs are integrated to html. Data url is supplied
using attribute 'data-url' of containing div(must have id 'grapharea'). Other data attributes
that can be used to configure graph are -
data-textcolor   - color of text on nodes(if any)
data-rmax        - max radius of nodes (px)
data-rmin        - min radius of nodes (px)
width            - width(px) of svg graph (as given in style attribute)
height           - height(px) of svg graph (as given in style attribute)
