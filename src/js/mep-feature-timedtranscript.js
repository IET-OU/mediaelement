/*global mejs:false, MediaElementPlayer:false */

(function($) {

	var the_track,
		the_media,
		last_idx = 0,
		search_idx;

	// add extra default options 
	$.extend(mejs.MepDefaults, {

		transcriptText: mejs.i18n.t('Text transcript'),
		transcriptSearchText: mejs.i18n.t('Search transcript'),

		// #id or .class		
		transcriptSelector: ''
	});


	$.extend(MediaElementPlayer.prototype, {

		buildtranscript: function(player, controls, layers, media) {
			if (player.tracks.length === 0) {
				return;
			}

			var t = this, 
				i, 
				options = '',
				$transcript = $(t.options.transcriptSelector);

			the_media = media;
			// TODO: select the correct "subtitles" track!!
			the_track = player.tracks[ 0 ];

			log('Transcript..');
			log(player.tracks);

			setTimeout(function () {
				player.loadTranscript();

				$('form', $transcript).on('submit', function (ev) {
					ev.preventDefault();
					var q = $(".q", $transcript).val();
					player.searchTranscript(q);
				});
			}, 500);


			media.addEventListener('timeupdate', function (e) {
				player.updateTranscriptText();
			}, false);
			
			log('build transcript');
		},


		loadTranscript: function () {

			/*if (typeof this.tracks == 'undefined')
				return;
			*/

			var
				t = this,
				i,
				label = t.options.transcriptSearchText,
				track = the_track, //track = t.selectedTrack,
				texts = track.entries.text,
				$transcript = $(t.options.transcriptSelector);

			//the_track = track;

			log($transcript);
			log(track.entries);

			$transcript.append(
			'<form><input class=q placeholder="' + label + '" aria-label="' + label + '"><input type="submit"></form>'
			);

			for (i=0; i < texts.length; i++) {
				$transcript.append(
				'<span class="tr-' + i + '">' + texts[i] + '</span> '
				);
				//log(track.entries.text[i]);
			}

			log(track);
		},

		updateTranscriptText: function () {
			var
				t = this,
				i,
				track = the_track, //t.selectedTrack;
				times = track.entries.times,
				$transcript = $(t.options.transcriptSelector),
				$tr, $last, $seek;

			log("Update transcript");
			//log(track.entries);

			for (i=0; i < times.length; i++) {
				if (t.media.currentTime >= times[i].start && t.media.currentTime <= times[i].stop){

					$last = $(".tr-" + (i - 1), $transcript);
					$last.removeClass("hi");
					$seek = $(".tr-" + search_idx, $transcript);
					$seek.removeClass("hi");
					$tr = $(".tr-" + i, $transcript);
					$tr.addClass("hi");

					last_idx = i;
					return; // exit out if one is visible;
				}
			}

			//log('Update 2');
		},


		searchTranscript: function (query) {
			var
				t = this,
				i,
				track = the_track,
				$transcript = $(t.options.transcriptSelector),
				$tr;

			log("Search:", query);

			for (i=0; i < track.entries.times.length; i++) {
				if (track.entries.text[i].match(query)) {
					$tr = $(".tr-" + i, $transcript);
					$tr.addClass("hi hiq");

					search_idx = i;

					the_media.play();
					the_media.pause();
					the_media.setCurrentTime(track.entries.times[i].start);

					return;
				}
			}
		}

	});

	function log(s) {
		window.console && console.log(arguments.length > 1 ? arguments : s);
	}

})(mejs.$);
