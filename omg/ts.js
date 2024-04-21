var TeamLists = {};
var AllTeams = {};
var CurrentTeamList = null; 
var CurrentTeamListName;
var defaultIconSrc = "https://images2.imgbox.com/a0/f5/ESeunKnt_o.png";
var scrollingToTeam = false;

function setTeamList(teamList){
	var teamListName = "";
	if(typeof(teamList) === 'string'){
		teamListName = teamList;
		teamList = TeamLists[teamList];
	}
	
	if(teamListName != "" && teamListName === CurrentTeamListName)
		return;
	
	if(typeof(UserCustomTeamList) !== 'undefined')
		teamList = teamList.concat(UserCustomTeamList);
	
	var tmpTeamsCssLines = [ '<style type="text/css" id="iconcss_tmp">' ];
	$("#messagebuffer").removeClass("teamlist_" + CurrentTeamListName);
	$("#messagebuffer").addClass("teamlist_" + teamListName);
	
	var newSelector = $("#selectteam ul");
	newSelector.html('<li tabindex="0" data-val=""><img src="' + defaultIconSrc + '"></li>');
	
	var selectedColorInList = false;
	var addOption = function(teamObj){
		if(!teamObj.ExclusiveTo || teamObj.ExclusiveTo == CLIENT.name){
			newSelector.append('<li tabindex="0" data-val="' + teamObj.id + '"><img src="' + teamObj.icon + '"><p>' + teamObj.name + '</p></li>');
			
			selectedColorInList = selectedColorInList || teamObj.id === TEAMCOLOR;
		}
	};
	teamList.forEach(function(team){
		if(typeof(team) === 'string' && AllTeams.hasOwnProperty(team)){
			addOption(AllTeams[team]);
		}
		else if(typeof(team) === 'object'){
			if(!AllTeams.hasOwnProperty(team.id) || teamListName == ""){
				InitTeam(team);
				tmpTeamsCssLines.push(team.css);
			}
			addOption(team);
		}
		 
	});
	
	if (tmpTeamsCssLines.length > 1){
		tmpTeamsCssLines.push('</style>');
		$('#iconcss_tmp').remove();
		$(document.head).append(tmpTeamsCssLines.join('\n'));
	}
	
	if(selectedColorInList){
		$("#selectteam li[data-val='"+TEAMCOLOR+"']").click();
	}
	else{
		$("#selectteam li:first").click();
	}
	
	CurrentTeamList = teamList;
	CurrentTeamListName = teamListName;
};

function InitTeamLists(){
	var cssLines = [
		'<style type="text/css" id="iconcss">'
	];
	Object.keys(TeamLists).forEach(function(key){
		var list = TeamLists[key];
		cssLines.push("\n/* " + key + " */");
		list.forEach(function(team){
			if(typeof(team) === 'object'){
				InitTeam(team);
				cssLines.push(team.css);
			}
		});
	});
	cssLines.push('</style>');
	
	var css = cssLines.join('\n');
	
	$("#iconcss").remove();
	$(document.head).append(css);
	
	$("#selectteam").remove();
	$("#chatline2").remove();
	$('<textarea class="form-control" id="chatline2" rows="1"></textarea>').insertAfter('#chatline');
	var dropup = $('<span class="dropup"></span>');
	var selectteam = $('<div id="selectteam"></div>').insertBefore('#chatwrap>form').append(dropup);
	dropup.append('<img class="dropdown-toggle" data-toggle="dropdown" title="Team Icon">');
	dropup.on('shown.bs.dropdown', function(){
		var elm = $('#selectteam li[data-val="'+TEAMCOLOR+'"]');
		if(elm && elm[0]){
			elm[0].parentNode.scrollTop = elm[0].offsetTop;
			elm[0].focus({preventScroll:true});
		}
	});
	var iconsPerRow = 11;
	$('<ul class="dropdown-menu"></ul>').appendTo(dropup)
		.on("click", "li", function(){
			TEAMCOLOR = this.dataset.val;
			setOpt(CHANNEL.name + "_TEAMCOLOR", TEAMCOLOR);
			if(TEAMCOLOR)
				$("#selectteam>span>img").attr("src", AllTeams[TEAMCOLOR].icon);
			else
				$("#selectteam>span>img").attr("src", defaultIconSrc);
		}).on("mouseover", "li", function(){
			if(!scrollingToTeam)
				this.focus({preventScroll:true});
			scrollingToTeam = false;
		}).on("keydown", function(event){
			var selected = $(document.activeElement);
			var elm = null;
			switch (event.key){
				case 'ArrowUp': case 'Up':
					if(selectteam.hasClass('grid')) {
						var length = selected.siblings().length;
						var iconsInLastRow = length % iconsPerRow;
						var indexAbove = selected.index() - iconsPerRow;
						if(iconsInLastRow != 0 && selected.index() >= (Math.floor(length / iconsPerRow) * iconsPerRow))
							indexAbove += Math.floor((iconsPerRow - iconsInLastRow) / 2);
						if(indexAbove >= 0)
							elm = $(selected.parent().children()[indexAbove]);
					} else
						elm = selected.prev();
					break;
				case 'ArrowDown': case 'Down':
					if(selectteam.hasClass('grid')) {
						var length = selected.siblings().length;
						var iconsInLastRow = length % iconsPerRow;
						var indexBelow = selected.index() + iconsPerRow;
						if(iconsInLastRow != 0 && indexBelow >= (Math.floor(length / iconsPerRow) * iconsPerRow)) {
							var lastRowAdjustment = Math.floor((iconsPerRow - iconsInLastRow) / 2);
							var indexInLastRow = indexBelow % iconsPerRow;
							if(indexInLastRow >= lastRowAdjustment)
								elm = $(selected.parent().children()[indexBelow - lastRowAdjustment]);
						} else if(indexBelow < selected.siblings().length)
							elm = $(selected.parent().children()[indexBelow]);
					} else
						elm = selected.next();
					break;
				case 'ArrowLeft': case 'Left':
					if(selectteam.hasClass('grid') && selected.index() % iconsPerRow != 0)
						elm = selected.prev();
					break;
				case 'ArrowRight': case 'Right':
					if(selectteam.hasClass('grid') && (selected.index()+1) % iconsPerRow != 0)
						elm = selected.next();
					break;
				case 'Tab':
					elm = event.shiftKey ? selected.prev() : selected.next();
					break;
				case 'Backspace': case 'Delete':
				    elm = $('#selectteam li:first-child');
					break;
				case 'Enter':
					event.stopPropagation();
					if(selected.parentsUntil('#selectteam').length)
						selected.click();
					break;
				case 'Escape':
					event.stopPropagation();
					selectteam.children('.dropdown-toggle').click();
					break;
				default: 
					if(event.key.length == 1){
						var itemSel = 'li[data-val^="'+event.key.toLowerCase()+'"]';
						elm = $('#selectteam li:focus~'+itemSel).first();
						if(!elm.length) elm = $('#selectteam '+itemSel).first();
					}
					break;
			}
			if(elm && elm[0]){
				event.stopPropagation();
				event.preventDefault();
				var liRect = elm[0].getBoundingClientRect();
				var ulRect = elm.parent()[0].getBoundingClientRect();
				if(liRect.top < ulRect.top || liRect.bottom > ulRect.bottom){
					scrollingToTeam = true;
					elm[0].parentNode.scrollTop = elm[0].offsetTop;
				}
				elm[0].focus({preventScroll:true});
			}
		});
	
}

function InitTeam(team) {
	if(team.icon.startsWith("/")){
		team.icon = "https://implyingrigged.info" + team.icon;
	}
	if(!team.hasOwnProperty('name')){
		team.name = team.id;
	}
	
	var cssSel = (team.ExclusiveTo ? ".chat-msg-" + team.ExclusiveTo + " ": "") + ".team" + team.id;
	team.css = cssSel+"{ color:"+team.color+"!important;} "+cssSel+"::before{ background-image:url('"+team.icon+"')!important;}";
	
	if(!AllTeams.hasOwnProperty(team.id))
		AllTeams[team.id] = team;
}
// omg color #62FFFC
var TeamLists = {
	"4cc":[
		{id:"DemonDrive",		color:"#92EEDE",icon:"https://images2.imgbox.com/28/4e/uhbzMTBL_o.png"},
		{id:"FrostFire",		color:"#",icon:"https://images2.imgbox.com/8e/dc/M3QBJSqs_o.png"},
		{id:"ByteBreaker",		color:"#EB819B",icon:"https://images2.imgbox.com/09/1b/nJFWPFqX_o.png"},
		{id:"ClaironCorp",		color:"#51FFB8",icon:"https://images2.imgbox.com/91/ff/DzSpRxq5_o.png"},
		{id:"Embermonarchy",		color:"#FEDF60",icon:"https://images2.imgbox.com/eb/e4/qegeYCql_o.png"},
		{id:"Maelstrom",		color:"#9D45FF",icon:"https://images2.imgbox.com/0b/81/dVDFqmHA_o.png"},
		{id:"SSR",			color:"#4EDAD0",icon:"https://images2.imgbox.com/2d/82/PCucAIDk_o.png"},
		{id:"BeeTeam",			color:"#F7E129",icon:"https://images2.imgbox.com/85/47/Kb3JTjCu_o.png"},
		{id:"OMCA",			color:"#437FDB",icon:"https://images2.imgbox.com/fd/52/pn32FsUR_o.png"},
		{id:"BellyBros",		color:"#EF3875",icon:"https://images2.imgbox.com/de/23/S7Klb8PR_o.png"},
		{id:"Lunatics",			color:"#E7E6E7",icon:"https://images2.imgbox.com/aa/97/bUuUKXcQ_o.png"},
		{id:"BigBop",			color:"#05E506",icon:"https://images2.imgbox.com/17/9c/K6F9Ljo8_o.png"},
		{id:"2Girls1Zentaro",		color:"#42EECF",icon:"https://images2.imgbox.com/38/3a/UfWIKQ0p_o.png"},
		{id:"PheromoneFactory",		color:"#C3B8EC",icon:"https://images2.imgbox.com/83/98/WW9SCSNG_o.png"},
		{id:"BigFiniish",		color:"#FFEDBA",icon:"https://images2.imgbox.com/a0/a0/nYSRErcF_o.png"},
	],
	"meme":[
		{id:"animeswords",	color:"#E31B22",icon:"/w/images/thumb/b/b4/Animeswords_icon.png/25px-Animeswords_icon.png"},
		{id:"aniplex",	color:"#3838A6",icon:"/w/images/thumb/0/0f/Aniplex_icon.png/25px-Aniplex_icon.png"},
		{id:"ccpg",	color:"#DE2910",icon:"/w/images/thumb/f/fd/Ccpg_icon.png/25px-Ccpg_icon.png"},
		{id:"cute",	color:"#EBA39D",icon:"https://implyingrigged.info/w/images/thumb/6/63/Cute_icon.png/25px-Cute_icon.png"},
		{id:"cygames",	color:"#61AFEF",icon:"https://implyingrigged.info/w/images/thumb/f/fb/Cygames_icon.png/25px-Cygames_icon.png"},
		{id:"eroge",	color:"#FFCC4D",icon:"https://implyingrigged.info/w/images/thumb/f/f6/Eroge_icon.png/25px-Eroge_icon.png"},
		{id:"racism",	color:"#FFF219",icon:"https://implyingrigged.info/w/images/thumb/9/9a/Racism_icon.png/25px-Racism_icon.png"},
		{id:"skfc",	color:"#FFFFFF",icon:"https://implyingrigged.info/w/images/thumb/b/bc/Skfc_icon.png/25px-Skfc_icon.png"},
		{id:"tamsoft",	color:"#023894",icon:"https://implyingrigged.info/w/images/thumb/9/9c/Tamsoft_icon.png/25px-Tamsoft_icon.png"},
	]


	/* when somebody makes an invitational and the teams are all in a neat multi-column list on the page,
	   inspect element > right-click > store as global variable > then in the console (edit as needed):
		[].slice.call(temp1.querySelectorAll('li')).map(function(li){ return { id:li.querySelector('b a').innerHTML.replace('/', '').replace('/', ''), color:'#999999', icon:li.querySelector('img').getAttribute('src') }; })
	*/
};

InitTeamLists();

if(getOrDefault(CHANNEL.name + "_SELECTTEAM_GRID", false))
	$('#toggleTeamSelStyle').click();
var TEAMCOLOR = getOrDefault(CHANNEL.name + "_TEAMCOLOR", '');
setTeamList("4cc");
if (TEAMCOLOR){
	$("#selectteam>span>img").attr("src", AllTeams[TEAMCOLOR].icon);
}
else{
	$("#selectteam>span>img").attr("src", defaultIconSrc);
}


//Format messages upon page load because they're handled differently and I can't find the function
$('.teamColorSpan').each(function(){
	var color = $(this).text().replace(new RegExp('-','g'),'');
	$(this).parent().parent().find('.username').addClass(color);
});
$('#messagebuffer div span').each(function(){
	var teamClass = $(this).html().match(/(\|@.+@\|)/gi);
	if (teamClass){
		$(this).html($(this).html().replace(teamClass[0],''));
		teamClass = 'team' + teamClass[0].replace('|@','').replace('@|','');
		console.log(teamClass);
		$(this).parent().find('.username').addClass(teamClass);
	} else {
		teamClass = '';
	}
});