var id = 'a458ef25343f2f838c698a95fe6d13d5'

SC.initialize({
	client_id: id
});

var styleNode           = document.createElement ("style");
styleNode.type          = "text/css";
styleNode.textContent   = "@font-face { font-family: guifx; src: url('"
                        + chrome.extension.getURL ("fonts/Guifx v2 Transports.ttf")
                        + "'); }"
                        ;
document.head.appendChild (styleNode);

var queue = new Array();
var soundId;
var isPlaying = true;
var prog = 0;
var first = true;
var newOrder = new Array();
var showQ = true;

function clearQueue() {
	queue.length=0;
	soundManager.destroySound(soundId);
	$('#qProgress').width('0%');
	isPlaying = false;
	showQ = false;
	prog = 0;
	displayQueue();
	$('#qPlayButton').text('1');
}

function nextTrack() {
	if (queue.length > 1) {
		soundManager.destroySound(soundId);
		queue.shift();
		$('#qProgress').width('0%');
		displayQueue();
		playTrack();
	} else {
		clearQueue();
	}
}

function playTrack() {
	soundManager.setup({
		url: 'swf/',
  		flashVersion: 9, // optional: shiny features (default = 8)
  		// optional: ignore Flash where possible, use 100% HTML5 mode
  		// preferFlash: false,
  		onready: function() {
    		// Ready to use; soundManager.createSound() etc. can now be called.
    		SC.stream("/tracks/" + queue[0].id, function(sound) {
    			isPlaying = true;
    			soundId = sound.id;
    			sound.play({
    				onfinish: function() {
    					if (queue.length === 1) {
    						clearQueue();
    					} else if (queue.length > 1) {
    						nextTrack();
    					}
    				},
    				whileplaying: function() {
    					prog = (this.position/this.durationEstimate) * 100;
    					$('#qProgress').width(prog + '%');
    				}
    			});
    		});
    	}
    });
}

function add(e) {
	var tmp = $(e.target).closest("li").find("a").first().attr('href');
	var trackUrl = 'https://soundcloud.com' + tmp;
	if (tmp === undefined) {
		trackUrl = $(location).attr('href');
	}
	$.get(
		'http://api.soundcloud.com/resolve.json?url=' + trackUrl + '&client_id=' + id, 
		function (sound) {
			if (!sound.streamable) {
				alert("no");
			} else {
				if (sound.kind === "playlist") {
					$(sound.tracks).each(function(index, track) {
						queue.push(track);
						if (queue.length === 1) {
							playTrack();
						}
					});
				} else {
					queue.push(sound);
					if (queue.length === 1) {
						playTrack();
					}
				}
			}
			displayQueue();
		}
		);
}

function button(val) {
	if (val === 0) {
		return $('<button/>', {
			text: "Queue",
			class: 'sc-button sc-button-queue sc-button-small sc-button-responsive',
		}).click(function(e){
			add(e);
		});
	} else if (val === 1) {
		return $('<button/>', {
			text: "Queue",
			class: 'sc-button sc-button-queue sc-button-small sc-button-icon sc-button-responsive',
		}).click(function(e){
			add(e);
		});

	} else if (val === 2) {
		return $('<button/>', {
			text: "Queue",
			class: 'sc-button sc-button-queue sc-button-medium sc-button-responsive',
		}).click(function(e){
			add(e);
		});
	};
};

function showPlayer() {
	if (queue.length === 0) {
		$('#soundqframe').height('40px');
	} else {
		$('#soundqframe').height('50px');
	}
	$('<div/>', {
		id: 'qPlayer',
	}).appendTo('#soundqframe');
	$('<div/>', {
		id: 'qPlayInfo',
	}).appendTo('#qPlayer');
	$('<div/>', {
		id: 'qShowButton',
		class: 'qOptions',
		text: '.'
	}).click(function() {
		if (queue.length > 1) {
			$('#list').slideToggle(400, function() {
				showQ = !showQ;
			});
		}
	}).appendTo('#qPlayInfo');
	$('<div/>', {
		id: 'qPlayButton',
		class: 'qOptions',
		text: function () {
			if (isPlaying) {
				return '2';
			} else {
				return '1';
			}
		}
	}).click(function() {
		isPlaying = !isPlaying;
		if (soundId !== null) {
			soundManager.togglePause(soundId);
		}
		if (queue.length !== 0) {
		if (isPlaying) {
			$('#qPlayButton').text('2');
		} else {
			$('#qPlayButton').text('1');
		}
	}
	}).appendTo('#qPlayInfo');
	$('<div/>', {
		id: 'qNextButton',
		class: 'qOptions',
		text: '8'
	}).click(function() {
		soundManager.stop(soundId);
		nextTrack();
	}).appendTo('#qPlayInfo');
	$('<div/>', {
		id: 'qScrubber',
		class: 'qOptions'
	}).appendTo('#qPlayInfo');
	$('<div/>', {
		id: 'qProgress',
		width: prog + '%'
	}).appendTo('#qScrubber');
	$('<div/>', {
		id: 'qClearButton',
		class: 'qOptions',
		html: 'x'
	}).click(function() {
		clearQueue();
	}).appendTo('#qPlayInfo');
}

function displayQueue() {
	if (first) {
		// $('body').width('80%');
		first = !first;
	}
	$('#soundqframe').html("");
	$('<div/>', {
		id: 'list',
	}).appendTo('#soundqframe');
	if (showQ) {
		$('#list').css({'display': 'block'});
	} else {
		$('#list').css({'display': 'none'});
	}
	$('<ul/>', {
		id: 'qlist',
	}).appendTo('#list');
	$('#qlist').sortable({
		cursorAt: {left: 50, top: 0},
		update: function(event, ui) {
			var result = $(this).sortable('toArray', {attribute: 'trackindex'});
			newOrder = result.reverse();
			console.log(newOrder);
			for (var i = 0; i < newOrder.length; i++) {
				newOrder[i] = queue[newOrder[i]];
			}
			for (var i = 0; i < newOrder.length; i++) {
				queue[i+1] = newOrder[i];
			}
			displayQueue();
			console.log(newOrder);
		}
	});
	var h = $(window).height() - 50 - 48;
	$('#list').css({'max-height': h});
	showPlayer();
	$(queue).each(function(index, track) {
		if (index === 0) {
			$('<div/>', {
				id: 'currTitle',
				class: 'soundTitle__title reveal',
				text: track.title
			}).click(function() {
				if (queue.length > 1) {
					$('#list').slideToggle(400, function() {
						showQ = !showQ;
					});
				}
			}).prependTo('#qPlayer');
		} 
		else {
			$('<li/>', {
				id: 'qEntryLi' + index,
				trackindex: index,
				class: 'qEntry',
				html: '<div class=\'qEntryContainer\' id = qEntry' + index + '><div class=\'reveal qTitle\'><span>' + track.title + '</span></div></div>',
			}).prependTo('#qlist');
			$('<div/>', {
				class: 'qMakeNext qChangeQ',
				text: '/',
				trackindex: index
			}).click(function() {
				var t = $(this).attr('trackindex');
				if (t !== 1) {
					var tmp = queue[t];
					queue.splice(t,1);
					queue.splice(1,0,tmp);
					displayQueue();
				}
			}).prependTo('#qEntry' + index);

			if (index === queue.length - 1) {
				$('#qEntryLi' + index).css({'padding-top': '5px'});
			}

			$('<div/>', {
				class: 'qRemove qChangeQ',
				text: '-',
				trackindex: index
			}).click(function() {
				var t = $(this).attr('trackindex');
				queue.splice(t,1);
				displayQueue();
			}).prependTo('#qEntry' + index);

		}

		$('.reveal').hoverIntent(
				function() {
					var maxScrollLeft = $(this)[0].scrollWidth - $(this)[0].clientWidth;
					var s = maxScrollLeft*10;
					$(this).animate({'scrollLeft': maxScrollLeft}, s, 'linear');
				},
				function () {
					var maxScrollLeft = $(this)[0].scrollWidth - $(this)[0].clientWidth;
					var s = maxScrollLeft*10;
					$(this).stop();
					$(this).animate({'scrollLeft': 0}, 0, 'linear');
				});
	});
}

$(document).ready(function() {

	$('<div/>', {
		id: 'soundqframe'
	}).appendTo('body');

	$(window).resize(function() {
		var h = $(window).height() - 50 - 48;
		$('#list').css({'max-height': h});
		if ($('#list').height() > h) {
			$('#list').height(h);
			$('#list').css({'overflow-y': 'scroll'});
		}
	});

	$(".sound__soundActions").find(".sc-button-share.sc-button-small").after(button(0));
	$(".soundBadge__actions").find(".sc-button-addtoset").after(button(1));
	$(".sc-button-group-medium").find(".sc-button-share").after(button(2));


	$(document).bind("DOMNodeInserted", function(e) {
		var elem = e.target;
		$(elem).find(".sound__soundActions").find(".sc-button-share.sc-button-small").after(button(0));
		$(elem).find(".soundBadge__actions").find(".sc-button-addtoset").after(button(1));
		$(elem).find(".sc-button-group-medium").find(".sc-button-share").after(button(2));
	});

});