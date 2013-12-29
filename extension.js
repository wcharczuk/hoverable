var Hoverable = (function(){

	var mediaTypes = {
		invalid : "invalid",
		image : "img",
		album : "album",
		video : "video",
		audio : "audio"
	};

	var hvr = {};
	hvr.showTimer = {};
	hvr.hideTimer = {};
	hvr.albumTimer = {};

	hvr.lastUrl = '';

	hvr.Options = {
		padding : 0,
		delay : 400,
	};

	hvr.Mouse = {};


	hvr.container 	= $('<div class="hoverable-container"></div>');
	hvr.media 		= $('<div class="hoverable-media"></div>');
	hvr.loader 		= $('<div class="hoverable-loader"></div>');
	hvr.img 		= $('<div class="hoverable-image"/>');

	$(hvr.media).append(hvr.loader);
	$(hvr.media).append(hvr.img);

	$(window).on('mousemove', 'body', function(e) {
		e = e || window.event;
	    var cursor = {
	      x: 0,
	      y: 0
	    };
	    if (e.pageX || e.pageY) {
	      cursor.x = e.pageX;
	      cursor.y = e.pageY;
	    } else {
	      cursor.x = e.clientX +
	        (document.documentElement.scrollLeft ||
	        document.body.scrollLeft) -
	        document.documentElement.clientLeft;
	      cursor.y = e.clientY +
	        (document.documentElement.scrollTop ||
	        document.body.scrollTop) -
	        document.documentElement.clientTop;
	    }
	    hvr.Mouse = {
	      x: cursor.x,
	      y: cursor.y
	    };
	});
	//END EVENT HOOKS

	hvr.hide = function() {
		cancelAlbumTimer();
		$(hvr.loader).show();
		$(hvr.img).hide();
		$(hvr.container).hide();
	};

	hvr.show = function(media) {
		
		$(hvr.img).hide();
		$(hvr.loader).show();

		if(media.type == mediaTypes.image) {
			$(hvr.img).empty();
			var image = new Image();

			$(image).attr('src', media.src);

			$(image).on("load", function() {
				$(hvr.loader).hide();
				$(hvr.img).data("height", image.height);
				$(hvr.img).data("width", image.width);
				$(hvr.img).append(image);
				$(hvr.img).show();
				hvr.positionContainer();
			});

			if(hvr.lastUrl == media.src) {
				$(hvr.loader).hide();
				$(hvr.img).data("height", image.height);
				$(hvr.img).data("width", image.width);
				$(hvr.img).append(image);
				$(hvr.img).show();
				hvr.positionContainer();
			}
		} else if (media.type == mediaTypes.album) {
			$(hvr.img).empty();
			for(var i = 0; i < media.images.length; i++) {
				var newImg = media.images[i];
				$(newImg).hide();

				if(i == 0) {
					$(newImg).show();
					$(newImg).on("load", function() {
						
						$(hvr.img).data("height", image.height);
						$(hvr.img).data("width", image.width);
	
						$(hvr.img).append(newImg);
						$(hvr.loader).hide();
						$(hvr.img).show();
						hvr.positionContainer();

						hvr.albumTimer = setTimeout(advanceAlbumImage, 1500);
					});
				} else {
					$(hvr.img).append(newImg);
				}
			}

			function advanceAlbumImage() {
				var current_index = parseInt($(hvr.img).data("album-index"));
				var albumLength = parseInt($(hvr.img).data("album-length"));
				current_index = current_index + 1;
				var album = $(hvr.img).data("album");
				if( current_index >= albumLength ) {
					current_index = 0;
				}

				$(hvr.img).find("img").hide();
				$($(hvr.img).find("img")[current_index]).show();
				$(hvr.img).data("album-index", current_index);

				hvr.albumTimer = setTimeout(advanceAlbumImage, 1500);
			}

			$(hvr.img).data("album-length", media.images.length);
			$(hvr.img).data("album-index", 0);
			$(hvr.img).on("click", advanceAlbumImage);
		}

		$(hvr.container).show();
		hvr.positionContainer();
	};

	hvr.positionContainer = function() {
		var padding = 50;

		var window_width = $(window).width();
		var window_height = $(window).height();

		var image_height = $(hvr.loader).height();
		var image_width = $(hvr.loader).width();

		if($(hvr.img).css('display') !== 'none') {
			image_height = $(hvr.img).data("height");
			image_width = $(hvr.img).data("width");
		}

		var landscape = image_height < image_width;

		var image_height_half = image_height >> 1;
		var image_width_half = image_width >> 1;

		var mouse_x = hvr.Mouse.x;
		var mouse_y = hvr.Mouse.y;

		var window_width_buffer_left = window_width - mouse_x;
		var window_width_buffer_right = window_width - (window_width - mouse_x);

		var window_height_buffer_up = window_height - mouse_y;
		var window_height_buffer_down = window_height - (window_height - mouse_y);

		var window_x_mid = window_width >> 1; //div by 2
		var window_y_mid = window_height >> 1; //div by 2

		var max_width = window_width;
		var max_height = window_height;

		var left = null;
		var top = null;
		var right = null;
		var bottom = null;

		var height_buffer = window_height_buffer_down;
		if(mouse_y > window_y_mid) {
			height_buffer = window_height_buffer_up;
		}

		var width_buffer = window_width_buffer_right;
		if(mouse_x > window_x_mid) {
			width_buffer = window_width_buffer_left
		}

		var aspect_ratio = image_width / image_height;

		if(landscape) {
			if(image_width > width_buffer) {
				if(mouse_x > window_x_mid) {
					left = mouse_x - (width_buffer + padding);
				} else {
					left = mouse_x + width_buffer + padding;
				}
				top = mouse_y - image_height_half;
			} else {
				if(mouse_x > window_x_mid) {
					left = mouse_x - (image_width + padding);
					
				} else {
					left = mouse_x + image_width + padding;
				}
			}
			max_width = width_buffer;


		} else { //portrait
			if(image_height > height_buffer) {
				max_height = window_height;
				top = 0;
			} else {
				top = mouse_y - image_height_half;
			}
		}

		//max-widths ...
		$(hvr.container).css('max-width', max_width + "px");
		$(hvr.container).css('max-height', max_height + "px");
		if($(hvr.img).css('display') !== 'none') {
			$(hvr.img).css('max-width', max_width + "px");
			$(hvr.img).css('max-height', max_height + "px");
			$(hvr.img).find("img").css('max-width', max_width + "px");
			$(hvr.img).find("img").css('max-height', max_height + "px");
		}

		if(left != null) $(hvr.container).css('left', left);
		if(top != null) $(hvr.container).css('top', top);
		if(right != null) $(hvr.container).css('right', right);
		if(bottom != null) $(hvr.container).css('bottom', bottom);
	};

	var cancelHideTimer = function() {
	    if (hvr.hideTimer) {
	      clearTimeout(hvr.hideTimer);
	  	}
  	};

  	var cancelShowTimer = function() {
  		if(hvr.showTimer) {
  			clearTimeout(hvr.showTimer);
  		}
  	};

  	var cancelAlbumTimer = function() {
  		if(hvr.albumTimer) {
  			clearTimeout(hvr.albumTimer);
  		}
  	}

	var onMouseOut = function(event) {
		cancelShowTimer();
		cancelAlbumTimer();
		hvr.hideTimer = setTimeout(function() {
			hvr.hide();
		}, hvr.Options.delay)
	};

	hvr.processMedia = function(target) {
		var media = {};

		var tag = $(target).prop("tagName");
		if(!(tag in ["A", "IMG"])) {
			var parent = $(target).parent();	
			if(parent.prop("tagName") == "A") {
				target = parent[0];
			}
			else {
				while(parent.lenght > 0 && parent.prop("tagName") != "BODY") {
					parent = parent.parent();
					if(parent.prop("tagName") == "A") {
						target = parent[0];
						break;
					}
				} 
			}
		}

		if(target.href) {
			media = hvr.processLink(target);
		} else if(target.src) {
			media = hvr.processImage(target);
		}

		if(media.type && media.type != mediaTypes.invalid) {
			hvr.show(media);
		} else {
			hvr.hide();
		}
	};

	hvr.processImage = function (target) {
		var media = {};

		media.type = mediaTypes.image;
		media.src = target.src;
	}

	var hostTransaltions = {
		'i.imgur.com': 'imgur.com'
	};

	var getHost = function(url) {
		var host = getLocation(url).hostname;
		var pieces = host.split('.');
		
		if(pieces.length > 2) {
			host = pieces[pieces.length - 2] + "." + pieces[pieces.length - 1];
		}
		return host;
	}

	hvr.processLink = function (target) {
		var media = {};

		if(target.href) {
			media.type = mediaTypes.image;
			var href = target.href;

			var host = getHost(href);

			if(isShortenedUrl(host)) {
				href = followShortenedLink(target);
			}

			if(isImageLink(href)) {
				media.src = href;
				return media;
			}
			else {
				host = getHost(href);

				var translatedHost = hostTransaltions[host];

				if(translatedHost) host = translatedHost;
				
				var siteModule = siteModules[host];

				if(siteModule) return siteModule.process(target);
			}
		}

		//eject!
		media.type = mediaTypes.invalid;
		media.src = '';

		return media;
	};

	var getLocation = function(url) {
		var l = document.createElement("a");
	    l.href = url;
	    return l;
	}

	var isShortenedUrl = function(host) {
		return (/(t\.co$|goo\.gl$|bit\.ly$|tiny\.cc$)/ig).test(host);
	};

	var followShortenedLink = function(target) {
		//special case for twitter links where they already have
		//the expanded url in the link attributes
		if($(target).attr('data-expanded-url') != null) {
			return $(target).attr('data-expanded-url');
		}

		var url = target.href;
		var response = fetchResponse(target.href);

		if(isRedirect(response)) {
			url = extractRedirectUrl(response);
		}

		return url;
	}

	var isImageLink = function(url) {
		return (/\.(gif|jpg|jpeg|png|apng|tiff)/ig).test(url);
	}

	var fetchResponse = function(url) {
		var result = $.ajax({ url: url, async: false });
		return result.responseText;
	}

	function isRedirect(response) {
		return (/\<noscript\>\<META http-equiv\=\"refresh\"/ig).test(response);
	}

	function extractRedirectUrl(response) {
		var expr = /URL=([^"]+)/ig;
		return response.match(expr)[0].replace("URL=", "");
	}

	function getHtml(url) {
		var response = fetchResponse(url);
		while(isRedirect(response)) {
			url = extractRedirectUrl(response);
			response = fetchResponse(url);
		}

		return response;
	}

	function parseJsonResult(response) {
		var obj = {};
		try {
			obj = eval(response);
		} catch(ex) {
			obj = eval("(" + response + ")");
		}
		return obj;
	}

	var siteModules = {
		"imgur.com" : {
			process : function(target) {
				var APIKey = 'fe266bc9466fe69aa1cf0904e7298eda'; //actually RES's key. 
				var apiPrefix ='http://api.imgur.com/2/';
				var hashRe = /^https?:\/\/(?:i\.|m\.|edge\.|www\.)*imgur\.com\/(?!gallery)(?!removalrequest)(?!random)(?!memegen)([A-Za-z0-9]{5}|[A-Za-z0-9]{7})[sbtmlh]?(\.(?:jpe?g|gif|png))?(\?.*)?$/i;
				var albumHashRe = /^https?:\/\/(?:i\.|m\.)?imgur\.com\/(?:a|gallery)\/([\w]+)(\..+)?(?:\/)?(?:#\w*)?$/i;

				var media = {};
				media.type = mediaTypes.image;

				var href = target.href;

				var groups = hashRe.exec(href);
				if(!groups) {
					media.type = mediaTypes.album;

					var albumGroups = albumHashRe.exec(href);
					
					var apiURL = apiPrefix + 'album/' + albumGroups[1] + '.json';

					var raw_result = $.ajax({ url : apiURL, dataType: "json", async: false });

					var data = parseJsonResult(raw_result.response);
					media.images = [];

					for(var i = 0; i < data.album.images.length; i++) {
						var imgData = data.album.images[i];
						var src = imgData.links.original;

						if(i == 0) {
							media.src = src;
						}
						var img = new Image();
						img.setAttribute("src", src);
						media.images.push(img);
					}
				} else {
					//normal imgur link (non album)
				}

				return media;
			}
		},
		"tumblr.com" : {
			process : function(target) {
				var media = {};
				media.type = mediaTypes.image;
				var results = getHtml(target.href);
				var page = $(results);

				var photoDiv = page.find(".photo-wrap img");
				media.src = photoDiv.attr("src");

				return media;
			}
		}, 
		"instagram.com" : {
			process : function(target) {
				var media = {};
				media.type = mediaTypes.image;
				var results = getHtml(target.href);
				var page = $(results);
				var photoDiv = page.find(".LikeableFrame.iMedia > div").attr('src');
				if(photoDiv) {
					media.src = photoDiv.attr("src");
				} else {
					var imgUrlExpr = /\"display_src\":\"([^"]+)\"/ig;
					var imgUrlResult = results.match(imgUrlExpr)[0];
					media.src = imgUrlResult
						.replace('"display_src":', "")
						.replace('"', '')
						.replace('"', '');
				}

				return media;
			}
		}, 
		"facebook.com" : {
			process : function(target) {
				var media = {};
				media.type = mediaTypes.invalid;

				return media;
			}
		},
	};

	$(hvr.container)
      .append(hvr.media)
      .mouseleave(onMouseOut)
      .mouseover(cancelHideTimer);

	$(document.body).append(hvr.container);

	$(document.body)
		.on('mouseover', 	'a, img', {}, function(event) {
			hvr.showTimer = setTimeout(function(){
				hvr.processMedia(event.target)
			}, hvr.Options.delay);
		})
		.on('mouseout', 	'a, img', {}, function(event) {
			hvr.hideTimer = setTimeout(function() {
				hvr.hide();
			}, hvr.Options.delay);
		});

	return hvr;
})();