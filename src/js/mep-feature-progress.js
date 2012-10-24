(function($) {

	$.extend(mejs.MepDefaults, {
		progressText: 'Seek bar',
		seekSeconds: 5
	});

	// progress/loaded bar
	$.extend(MediaElementPlayer.prototype, {
		buildprogress: function(player, controls, layers, media) {

			$('<div class="mejs-time-rail">'+
				'<span class="mejs-time-total">'+
					'<span class="mejs-time-buffering"></span>'+
					'<span class="mejs-time-loaded"></span>'+
					'<span class="mejs-time-current"></span>'+
					'<span class="mejs-time-handle"></span>'+
					'<span class="mejs-time-float">' + 
						'<span class="mejs-time-float-current">00:00</span>' + 
						'<span class="mejs-time-float-corner"></span>' + 
					'</span>'+
				'</span>'+
			'</div>')
				.appendTo(controls);
				controls.find('.mejs-time-buffering').hide();

			var 
				t = this,
				op = t.options,
				total = controls.find('.mejs-time-total'),
				loaded  = controls.find('.mejs-time-loaded'),
				current  = controls.find('.mejs-time-current'),
				handle  = controls.find('.mejs-time-handle'),
				timefloat  = controls.find('.mejs-time-float'),
				timefloatcurrent  = controls.find('.mejs-time-float-current'),
				handleMouseMove = function (e) {
					// mouse position relative to the object
					var x = e.pageX,
						offset = total.offset(),
						width = total.outerWidth(),
						percentage = 0,
						newTime = 0,
						pos = x - offset.left;


					if (x > offset.left && x <= width + offset.left && media.duration) {
						percentage = ((x - offset.left) / width);
						newTime = (percentage <= 0.02) ? 0 : percentage * media.duration;

						// seek to where the mouse is
						if (mouseIsDown) {
							media.setCurrentTime(newTime);
						}

						// position floating time box
						if (!mejs.MediaFeatures.hasTouch) {
								timefloat.css('left', pos);
								timefloatcurrent.html( mejs.Utility.secondsToTimeCode(newTime) );
								timefloat.show();
						}
					}
				},
				mouseIsDown = false,
				mouseIsOver = false;

				handleKeyMove = function(sec, e) {
					if (-1 == sec || sec >= media.duration) {
						media.pause();
						media.setCurrentTime(media.duration - 0.01);
					} else {
						media.setCurrentTime(sec);
					}
					e.preventDefault();
				};

				updateSlider = function(e) {
					var sec = media.currentTime,
						time = mejs.Utility.secondsToTimeCode(sec),
						d = media.duration;

					// WAI-ARIA accessibility
					// Property or attribute? Ender doesn't have prop() - use attr()
					handle.attr({
						'aria-valuenow': sec,
						'aria-valuetext': time,
						'aria-valuemin': 0,
						'aria-valuemax': d,
						'aria-label': op.progressText,
						'tabindex': 0,
						'role': 'slider'
					});
				};

			// handle keyboard - accessibility.
			handle.bind('keydown', function(e) {

				if (e.keyCode >= 35 && e.keyCode <= 39) {
					try {
					var c = media.currentTime;
					// mac Command + left/right.
					if (typeof e.metaKey!='undefined' && e.metaKey) {
						if (e.keyCode==37) {
							handleKeyMove(0, e);
						}
						else if (e.keyCode==39) {
							handleKeyMove(-1, e);
						}
					} else {
					switch (e.keyCode) {
					    case 37: // left
							handleKeyMove(c - op.seekSeconds, e);
					    break;

						case 39: // right
							handleKeyMove(c + op.seekSeconds, e);
						break;

						case 36: // home (windows)
							handleKeyMove(0, e);
						break;

						case 35: // end (windows)
							handleKeyMove(-1, e);
						break;
					}
					}
				} catch (ex) {
					//Error - how to handle?
				}
				}
			});

			// handle clicks
			//controls.find('.mejs-time-rail').delegate('span', 'click', handleMouseMove);
			total
				.bind('mousedown', function (e) {
					// only handle left clicks
					if (e.which === 1) {
						mouseIsDown = true;
						handleMouseMove(e);
						$(document)
							.bind('mousemove.dur', function(e) {
								handleMouseMove(e);
							})
							.bind('mouseup.dur', function (e) {
								mouseIsDown = false;
								timefloat.hide();
								$(document).unbind('.dur');
							});
						return false;
					}
				})
				.bind('mouseenter', function(e) {
					mouseIsOver = true;
					$(document).bind('mousemove.dur', function(e) {
						handleMouseMove(e);
					});
					if (!mejs.MediaFeatures.hasTouch) {
						timefloat.show();
					}
				})
				.bind('mouseleave',function(e) {
					mouseIsOver = false;
					if (!mouseIsDown) {
						$(document).unbind('.dur');
						timefloat.hide();
					}
				});

			// loading
			media.addEventListener('progress', function (e) {
				player.setProgressRail(e);
				player.setCurrentRail(e);
			}, false);

			// current time
			media.addEventListener('timeupdate', function(e) {
				player.setProgressRail(e);
				player.setCurrentRail(e);

				updateSlider(e);

			}, false);
			
			
			// store for later use
			t.loaded = loaded;
			t.total = total;
			t.current = current;
			t.handle = handle;
		},
		setProgressRail: function(e) {

			var
				t = this,
				target = (e != undefined) ? e.target : t.media,
				percent = null;			

			// newest HTML5 spec has buffered array (FF4, Webkit)
			if (target && target.buffered && target.buffered.length > 0 && target.buffered.end && target.duration) {
				// TODO: account for a real array with multiple values (only Firefox 4 has this so far) 
				percent = target.buffered.end(0) / target.duration;
			} 
			// Some browsers (e.g., FF3.6 and Safari 5) cannot calculate target.bufferered.end()
			// to be anything other than 0. If the byte count is available we use this instead.
			// Browsers that support the else if do not seem to have the bufferedBytes value and
			// should skip to there. Tested in Safari 5, Webkit head, FF3.6, Chrome 6, IE 7/8.
			else if (target && target.bytesTotal != undefined && target.bytesTotal > 0 && target.bufferedBytes != undefined) {
				percent = target.bufferedBytes / target.bytesTotal;
			}
			// Firefox 3 with an Ogg file seems to go this way
			else if (e && e.lengthComputable && e.total != 0) {
				percent = e.loaded/e.total;
			}

			// finally update the progress bar
			if (percent !== null) {
				percent = Math.min(1, Math.max(0, percent));
				// update loaded bar
				if (t.loaded && t.total) {
					t.loaded.width(t.total.width() * percent);
				}
			}
		},
		setCurrentRail: function() {

			var t = this;
		
			if (t.media.currentTime != undefined && t.media.duration) {

				// update bar and handle
				if (t.total && t.handle) {
					var 
						newWidth = t.total.width() * t.media.currentTime / t.media.duration,
						handlePos = newWidth - (t.handle.outerWidth(true) / 2);

					t.current.width(newWidth);
					t.handle.css('left', handlePos);
				}
			}

		}	
	});
})(mejs.$);