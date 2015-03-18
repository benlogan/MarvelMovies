var res = [];
$("div.info").each(function(){
	var info = {};
	var div = $(this);
	var name = $.trim(div.find("b:first").text())
        info.url = "http://www.imdb.com"+$.trim(div.find("b:first a").attr("href"))
	info.name = name.replace(/\\n.*/,"");
	info.year = name.match(/\(\d+\)/) ? name.match(/\(\d+\)/)[0] : "";
	info.director = "";
	info.stars = [];
	var secondary = div.find("div.secondary");
	if(secondary.size() == 1){
		if(secondary.text().match(/Director/))
			info.director = $.trim(secondary.find("a").eq(0).text());
		else if(secondary.text().match(/Stars/)){
			secondary.find("a").each(function(){
				info.stars.push($(this).text());
			});
		}
	}else if(secondary.size() > 1){
		info.director = $.trim(secondary.eq(0).find("a").eq(0).text());
		secondary.eq(1).find("a").each(function(){
			info.stars.push($(this).text());
		});
	}
	info.rating = div.find("span.rating-rating span.value").text();
	res.push(info);
});
console.log(JSON.stringify(res));