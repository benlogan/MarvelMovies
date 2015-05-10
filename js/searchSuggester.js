var addSuggester = function (inputSelector, suggester, onclick) {
    $(inputSelector).keyup(function (e) {
        var input = $(this);
        var term = input.val(), list = $('div#suggest ul');
        var code = e.keyCode || e.which;
        if (code === 13) $('li.infocus').click();
        if (code === 27) $("div#suggest").empty();
        if (code === 40) {
            if (!list.find('li').size()) return;
            if (!list.find('li.infocus').size() || list.find('li:last').hasClass('infocus'))
                list.find('li:first').mouseover();
            else list.find("li.infocus").next().mouseover();
        }
        if (code === 38) {
            if (!list.find('li').size()) return;
            if (!list.find('li.infocus').size() || list.find('li:first').hasClass('infocus'))
                list.find('li:last').mouseover();
            else list.find("li.infocus").prev().mouseover();
        }
        if (code >= 65) {
            var data = suggester(term);
            if (data.length) {
                $("div#suggest").empty();
                var ul = $("<ul class='dropdown-menu' style=''></ul>");
                data.forEach(function (v) {
                    ul.append($("<li><a href='#'>" + v + "</a></li>"));
                });
                var li = ul.find("li");
                li.removeClass("infocus").eq(0).addClass("infocus");
                li.click(function (e) {
                    e.preventDefault();
                    var li = $(this);
                    input.val(li.text());
                    ul.fadeOut('fast');
                    if (onclick && typeof onclick === 'function') onclick();
                }).mouseover(function () {
                    var li = $(this);
                    li.siblings('li').removeClass("infocus");
                    li.addClass("infocus");
                });
                $("div#suggest").append(ul);
                ul.fadeIn('fast');
                list = ul;
            }
        }
    }).click(function () {
        $("div#suggest").empty();
    });
};