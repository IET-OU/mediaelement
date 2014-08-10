/*!
 * Plugin extension for MediaElement.js to provide a synchronized transcript.
 *
 * Features:
 *   - Highlight word/phrase in transcript as audio/video is played,
 *   - Search for word, and seek to that point in media,
 *   - Click on word/phrase to jump to that point in media (in PROGRESS),
 *   - Auto-scroll of the transcript as media plays (in PROGRESS).
 *
 * TODOs: 
 *   - Select the "correct" captions/subtitles track,
 *   - Reduce the update frequency - auto-scroll bugs?
 *   - Transcript positioning and show/hide.
 *
 * http://w3.org/TR/html5/embedded-content-0.html#the-track-element
 *
 * mep-feature-timedtranscript.js (Requires: mep-feature-tracks.js)
 *
 * Copyright (c) 2014-06-26 Nick Freear.
 */

/*global mejs:false, MediaElementPlayer:false */


(function($) {

	var	$transcript,
		the_track,
		last_idx = 0,
		search_idx,
		auto_scroll;


	// add extra default options 
	$.extend(mejs.MepDefaults, {

		transcriptText: mejs.i18n.t('Seekable text script'),
		transcriptSearchText: mejs.i18n.t('Search script'),

		// #id or .class		
		transcriptSelector: '',

		transcriptScroll: true
	});


	$.extend(MediaElementPlayer.prototype, {

		buildtimedtranscript: function (player, controls, layers, media) {
			if (player.tracks.length === 0) {
				return;
			}

			var t = this;

			$transcript = $(t.options.transcriptSelector)
				.addClass("mejs-timedtranscript");
			// TODO: select the correct "subtitles" track!
			the_track = player.tracks[ 0 ];
			auto_scroll = t.options.transcriptScroll;

			log('Transcript..');
			log(player.tracks);

			// TODO: need a "tracksloaded" event!
			setTimeout(function () {
				player.loadTranscript();

				// Search.
				$('form', $transcript).on('submit', function (ev) {
					ev.preventDefault();
					var q = $(".q", $transcript).val();
					player.searchTranscript(q);
				});

				// Click on text to seek.
				$('[role=button]', $transcript).on('click', function () {
					var q = $(this, $transcript).text();
					player.searchTranscript(q);
				});

				log('transcript loaded');
			}, 800);


			media.addEventListener('timeupdate', function (ev) {
				player.updateTranscriptText();
			}, false);
		},


		loadTranscript: function () {

			var
				t = this,
				i,
				slabel = t.options.transcriptSearchText,
				tlabel = t.options.transcriptText,
				track = the_track, //track = t.selectedTrack,
				texts = track.entries.text;

			log($transcript);
			log(track.entries);

			$transcript.attr('aria-label', tlabel);

			$transcript.append(
				'<form><input class="q" placeholder="' + slabel + '" aria-label="' +
				slabel + '"><input type="submit"></form>'
			);

			for (i=0; i < texts.length; i++) {
				$transcript.append(
				'<span class="tr-' + i + '" tabindex=0 role=button >' + texts[i] + '</span> '
				);
				//log(track.entries.text[i]);
			}

			log(track);
		},

		updateTranscriptText: function () {
			var
				t = this,
				i,
				track = the_track,  //t.selectedTrack
				currentTime = t.media.currentTime,
				times = track.entries.times,
				$tr;

			log("Update transcript");
			//log(track.entries);

			for (i=0; i < times.length; i++) {
				$tr = $(".tr-" + i, $transcript);

				if (currentTime >= times[i].start && currentTime <= times[i].stop) {
					$tr.addClass("hi");
					scrollToElement($tr);

					last_idx = i;
				} else {
					$tr.removeClass("hi");
				}
			}
		},


		// Currently a naive case-insensitive search.
		searchTranscript: function (query) {
			var
				t = this,
				i,
				re = new RegExp(query, 'i'),
				track = the_track,
				media = t.media, //the_media,
				times = track.entries.times,
				$tr;

			log("Search:", query);

			for (i=0; i < times.length; i++) {
				$tr = $(".tr-" + i, $transcript);

				if (track.entries.text[i].match(re)) {
					$tr.addClass("hi hiq").focus();

					search_idx = i;

					media.play();
					media.pause();
					media.setCurrentTime(times[i].start);
				} else {
					$tr.removeClass("hi");
				}
			}
		}

	});

	//Inspired: http://stackoverflow.com/questions/19498517/javascript-scroll-to-div-with-animation
	var scrollToElement = function(el, ms){
		//$transcript.scrollTo(el); return;

		if (!auto_scroll) return;

		$transcript.css("position", "relative");

		var speed = (ms) ? ms : 600;
		log("Scroll", $(el).position().top);
		$transcript.animate({  //Was: $('html,body')
			scrollTop: $(el).position().top  //$(el).offset().top
		}, speed);
	}

	function log(s) {
		window.console && console.log(arguments.length > 1 ? arguments : s);
	}

})(mejs.$);
