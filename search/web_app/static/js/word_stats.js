var lastFreqData = null;
var margin = {"top": 20, "right": 30, "bottom": 30, "left": 80};
var x = null;
var y = null;
var gx = null;
var gy = null;
var xAxis = null;
var yAxis = null;
var chart = null;
var svg = null;
var bar = null;
var data = null;

function vw(v) {
    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    return (v * w) / 100;
}

$(function() {
	function assign_word_stats_events() {
		$('#select_meta_word_stat').unbind('change');
		$('#select_meta_query_type').unbind('change');
		$('#select_freq_stat_type').unbind('change');
		$('#select_x_axis_scale').unbind('change');
		$('#word_stats_ok').unbind('click');
		$('#button_close_word_stats').unbind('click');
		$('#load_word_meta_stats').unbind('click');
		$('#load_word_freq_stats').unbind('click');
		$('#select_meta_word_stat').change(load_word_stats);
		$('#select_meta_query_type').change(load_word_stats);
		$('#select_freq_stat_type').change(load_freq_stats);
		$('#select_x_axis_scale').change(function () {display_word_freq_stats_plot(lastFreqData);});
		$('#word_stats_ok').click(close_word_stats);
		$('#button_close_word_stats').click(close_word_stats);
		$('#load_word_meta_stats').click(load_word_stats);
		$('#load_word_freq_stats').click(load_freq_stats);
	}

	function close_word_stats() {
		$('#word_stats').modal('toggle');
		$('#w_id1').val('');
	}
	
	function clear_word_stats_plots(results) {
		$('#word_stats_plot').html('<svg></svg>');
		$('#word_freq_rank_stats_plot').html('<svg></svg>');
		$('#word_stats_nothing_found').hide();
		$('#word_stats_wait').show();
	}

	function resize_svg() {
	    var viewBoxY = (40 + $(".word_meta_plot>g")[0].getBBox()["height"]);
	    var viewBoxX = 600;
		$(".word_meta_plot").attr("viewBox", "0 0 " + viewBoxX + " " + viewBoxY);
		$(".word_meta_plot").css("min-height", Math.max(300, $(".word_meta_plot>g")[0].getBBox()["height"]));
		$(".word_meta_plot").css("min-width", vw(50));
		try {
		    var yAxisWidth = $("#y_axis")[0].getBBox()["width"];
		    $(".word_meta_plot>g").attr("transform", "translate(" + yAxisWidth + "," + margin["top"] + ")");
		}
		catch (e) {
		    setTimeout(1000, function() {
		        yAxisWidth = $("#y_axis")[0].getBBox()["width"];
		        $(".word_meta_plot>g").attr("transform", "translate(" + yAxisWidth + "," + margin["top"] + ")");
		    })
		}
	}

	function make_x_gridlines() {
        return d3.axisBottom(x)
            .ticks(5)
    }

    // gridlines in y axis function
    function make_y_gridlines() {
        return d3.axisLeft(y)
            .ticks(5)
    }

	function load_word_stats(e) {
		clear_word_stats_plots();

		var metaField = $('#select_meta_word_stat option:selected').attr('value');
		if (metaField == '') {
			return;
		}
		var queryType = $('#select_meta_query_type option:selected').attr('value');
		if (queryType == '') {
			return;
		}
		
		$.ajax({
			url: "word_stats/" + queryType + '/' + metaField,
			data: $("#search_main").serialize(),
			dataType : "json",
			type: "GET",
			success: display_word_stats_plot,
			error: function(errorThrown) {
				alert( JSON.stringify(errorThrown) );
			}
		});
	}
	
	function load_freq_stats(e) {
		var freqStatType = $('#select_freq_stat_type option:selected').attr('value');
		if (freqStatType == '') {
			clear_word_stats_plots();
			return;
		}
		
		$.ajax({
			url: "word_freq_stats/" + freqStatType,
			data: $("#search_main").serialize(),
			dataType : "json",
			type: "GET",
			success: display_word_freq_stats_plot,
			//success: print_json,
			error: function(errorThrown) {
				alert( JSON.stringify(errorThrown) );
			}
		});
	}
	
	function show_bar_chart(results, maxHeight) {
		var nResults = results.length;
		var barWidth = 20;
		var maxBars = 25;
		var nBars = nResults;
		if (nBars > maxBars) {
			nBars = maxBars;
		}
	    x = d3.scaleBand()
            .rangeRound([0, barWidth * nBars], .1)
		    .paddingInner(0.1);
		y = d3.scaleLinear()
			.range([200, 0]);

		xAxis = d3.axisBottom().scale(x);
		yAxis = d3.axisLeft().scale(y).tickFormat(function (d) { return d + ' ipm'; });
/*
		var chart = d3.select(".word_meta_plot")
			.attr("width", barWidth * nBars + margin.left + margin.right)
			.attr("height", 320 + margin.top + margin.bottom)
		  .append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
*/
		chart = d3.select(".word_meta_plot").append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
		y.domain([0, maxHeight]);
		x.domain(results.map(function(v) { return v.name; }));
		
		gx = chart.append("g")
		    .attr("class", "x axis")
		    .attr("transform", "translate(0,200)")
		    .call(xAxis);
		gx.selectAll("text")
            .style("text-anchor", "start")
            .attr("dx", "10px")
            .attr("dy", "-5px")
            .attr("transform", "rotate(90)");
			
	    gy = chart.append("g")
		    .attr("class", "y axis")
		    .attr("id", "y_axis")
		    .call(yAxis);
		chart.append("g")
          .attr("class", "grid")
          .call(make_y_gridlines()
              .tickSize(-500)
              .tickFormat("")
          );

		bar = chart.selectAll(".bar")
		    .data(results)
		  .enter().append("rect")
		    .attr("class", "bar")
		    .attr("x", v => x(v.name))
			.attr("width", x.bandwidth())
			.attr("y", 200)
			.attr("height", 0)
			.transition().duration(1200)
		    .attr("y", v => y(v.n_words))
		    .attr("height", v => 200 - y(v.n_words));
		chart.selectAll(".bar")
		    .data(results)
		  .append("title")
		    .text(v => Math.round(v.n_words) + " ipm [" + Math.round(v.n_words_conf_int[0]) + ", " + Math.round(v.n_words_conf_int[1]) + "]");
		chart.selectAll(".conf_int_new")
		    .data(results)
		  .enter().append("line")
		    .attr("class", "conf_int")
		    .attr("x1", v => x(v.name) + barWidth / 2)
			.attr("x2", v => x(v.name) + barWidth / 2)
			.attr("y1", 200)
			.attr("y2", 200)
			.transition().duration(1200)
		    .attr("y1", v => y(v.n_words_conf_int[0]))
		    .attr("y2", v => y(v.n_words_conf_int[1]));
		chart.selectAll(".conf_int_cap_top_new")
		    .data(results)
		  .enter().append("line")
		    .attr("class", "conf_int_cap_top")
		    .attr("x1", v => x(v.name) + barWidth / 2 - 3)
			.attr("x2", v => x(v.name) + barWidth / 2 + 3)
			.attr("y1", 200)
			.attr("y2", 200)
			.transition().duration(1200)
		    .attr("y1", v => y(v.n_words_conf_int[0]))
		    .attr("y2", v => y(v.n_words_conf_int[0]));
		chart.selectAll(".conf_int_cap_bottom_new")
		    .data(results)
		  .enter().append("line")
		    .attr("class", "conf_int_cap_bottom")
		    .attr("x1", v => x(v.name) + barWidth / 2 - 3)
			.attr("x2", v => x(v.name) + barWidth / 2 + 3)
			.attr("y1", 200)
			.attr("y2", 200)
			.transition().duration(1200)
		    .attr("y1", v => y(v.n_words_conf_int[1]))
		    .attr("y2", v => y(v.n_words_conf_int[1]));

		setTimeout(resize_svg, 300);
	}
	
	function show_line_plot(results, maxHeight, multiplier, yLabel) {
		if (results == null || results.length <= 0) {
			return;
		}
		var nResults = results[0].length;
		
		var xAxisScale = $('#select_x_axis_scale option:selected').val();
		if (xAxisScale == 'logarithmic') {
			function xTransform(v) { return parseInt(v.name) + 1; }
			x = d3.scaleLog()
				.range([0, 350]);
		}
		else {
			function xTransform(v) { return parseInt(v.name); }
			x = d3.scaleLinear()
				.range([2, 502]);
		}
		var xDomain = d3.extent(results[0], xTransform);
		y = d3.scaleLinear()
			.range([200, 0]);

		xAxis = d3.axisBottom().scale(x).tickFormat(d => Math.round(d) == d ? d + "" : "");
		yAxis = d3.axisLeft().scale(y).tickFormat(d => d + yLabel);

		chart = d3.select(".word_meta_plot").append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
		y.domain([0, maxHeight * multiplier]);
		x.domain(xDomain);
		
		gx = chart.append("g")
		    .attr("class", "x axis")
		    .attr("transform", "translate(0,200)")
		    .call(xAxis);
		gx.selectAll("text")  
            .style("text-anchor", "start")
            .attr("dx", "10px")
            .attr("dy", "-5px")
            .attr("transform", "rotate(90)");
			
	    gy = chart.append("g")
		    .attr("class", "y axis")
		    .call(yAxis);

		chart.append("g")
          .attr("class", "grid")
          .attr("transform", "translate(0,200)")
          .call(make_x_gridlines()
              .tickSize(-200)
              .tickFormat("")
          );

        chart.append("g")
          .attr("class", "grid")
          .call(make_y_gridlines()
              .tickSize(-500)
              .tickFormat("")
          );
		
		for (iQueryWord = 0; iQueryWord < results.length; iQueryWord++) {	
			var valueline = d3.line()
				.x(v => x(xTransform(v)))
				.y(v => y(v.n_words * multiplier))
				.curve(d3.curveBasis);
				//.curve(d3.curveLinear);
			var valuelineInitial = d3.line()
				.x(v => x(xTransform(v)))
				.y(200)
				.curve(d3.curveBasis);
			chart.append("path")
				.data([results[iQueryWord]])
				.attr("class", "plot_line_w" + (iQueryWord + 1) + " plot_line")
				.attr("d", valuelineInitial)
				.transition().duration(1200)
				.attr("d", valueline);
			chart.selectAll("dot")
				.data(results[iQueryWord])
			  .enter().append("circle")
				.attr("r", 3.5)
				.attr("cx", v => x(xTransform(v)))
				.attr("cy", 200)
				.attr("class", "plot_circle plot_circle_w" + (iQueryWord + 1))
				.transition().duration(1200)
				.attr("cy", v => y(v.n_words * multiplier));

			if ('n_words_conf_int' in results[iQueryWord][0]) {
			    chart.selectAll(".plot_circle_w" + (iQueryWord + 1))
		            .data(results[iQueryWord])
		          .append("title")
		            .text(v => Math.round(v.n_words) + " ipm [" + Math.round(v.n_words_conf_int[0]) + ", " + Math.round(v.n_words_conf_int[1]) + "]");

				chart.selectAll(".conf_int_new")
				    .data(results[iQueryWord])
				  .enter().append("line")
				    .attr("class", "conf_int plot_line_w" + (iQueryWord + 1))
				    .attr("x1", v => x(xTransform(v)))
					.attr("x2", v => x(xTransform(v)))
					.attr("y1", 200)
					.attr("y2", 200)
					.transition().duration(1200)
				    .attr("y1", v => y(v.n_words_conf_int[0] * multiplier))
				    .attr("y2", v => y(v.n_words_conf_int[1] * multiplier));
				chart.selectAll(".conf_int_cap_top_new")
				    .data(results[iQueryWord])
				  .enter().append("line")
				    .attr("class", "conf_int_cap_top plot_line_w" + (iQueryWord + 1))
				    .attr("x1", v => x(xTransform(v)) - 3)
					.attr("x2", v => x(xTransform(v)) + 3)
					.attr("y1", 200)
					.attr("y2", 200)
					.transition().duration(1200)
				    .attr("y1", v => y(v.n_words_conf_int[0] * multiplier))
				    .attr("y2", v => y(v.n_words_conf_int[0] * multiplier));
				chart.selectAll(".conf_int_cap_bottom_new")
				    .data(results[iQueryWord])
				  .enter().append("line")
				    .attr("class", "conf_int_cap_bottom plot_line_w" + (iQueryWord + 1))
				    .attr("x1", v => x(xTransform(v)) - 3)
					.attr("x2", v => x(xTransform(v)) + 3)
					.attr("y1", 200)
					.attr("y2", 200)
					.transition().duration(1200)
				    .attr("y1", v => y(v.n_words_conf_int[1] * multiplier))
				    .attr("y2", v => y(v.n_words_conf_int[1] * multiplier));
			}
		}
		chart.selectAll(".plot_circle")
		    .on('mouseover', function (d, i) {
                d3.select(this).transition()
                .duration('300')
                .attr('r', '7');
            })
            .on('mouseout', function (d, i) {
                d3.select(this).transition()
                .duration('300')
                .attr('r', '3.5');
            });
		setTimeout(resize_svg, 300);
	}

	function clear_table() {
	    $('#word_stats_table tbody').html("");
	    $('#word_stats_table_header').html("<th></th>");
	}

	function fill_table(results) {
	    var tableBody = $('#word_stats_table tbody');
	    var tableHeader = $('#word_stats_table_header');
	    clear_table();
	    if (results == null) {
			return;
		}
		for (iQueryWord = 0; iQueryWord < results.length; iQueryWord++) {
		    tableHeader.html(tableHeader.html() + "<th colspan=\"2\">" + queryWordCaption + " " + (iQueryWord + 1) + "</th>")
		    for (iRes = 0; iRes < results[iQueryWord].length; iRes++) {
		        v = results[iQueryWord][iRes];
                var tr = "<tr>";
                tr += "<td>" + v.name + "</td>";
                tr += "<td>" + Math.round(v.n_words) + "</td>"
                tr += "<td class=\"conf_int_span\"> [" + Math.round(v.n_words_conf_int[0]) + ", " + Math.round(v.n_words_conf_int[1]) + "]</td>";
                tr += "</tr>";
                tableBody.html(tr + tableBody.html());
            }
		}
	}
	
	function display_word_stats_plot(results) {
		clear_word_stats_plots();
		clear_table();
		$('#word_stats_wait').fadeOut();

		data = results;
		if (results == null) {
			$('#word_stats_nothing_found').show();
			return;
		}
		var plotObj = $('#word_stats_plot');
		if (results.length <= 0 || results[0].length <= 0) {
			$('#word_stats_nothing_found').show();
			return;
		}
		var metaField = $('#select_meta_word_stat option:selected').val();
		if (metaField == '') {
			return;
		}
		var maxHeight = 1
		for (iQueryWord = 0; iQueryWord < results.length; iQueryWord++) {
			var curMaxHeight = d3.max(results[iQueryWord], v => v.n_words);
			if (curMaxHeight > maxHeight) {
				maxHeight = curMaxHeight;
			}
		}
		fill_table(results);
		svg = d3.create("svg");
      	plotObj.append(svg);
      	plotObj.find('svg').addClass('word_meta_plot').attr("viewBox", "0 0 600 350");
		if (metaField.startsWith('year')) {
			show_line_plot(results, maxHeight, 1, ' ipm');
		}
		else
		{
			show_bar_chart(results[0], maxHeight);
		}
	}
	
	function display_word_freq_stats_plot(results) {
		clear_word_stats_plots();
		clear_table();
		$('#word_stats_wait').fadeOut();
		if (results == null) {
			$('#word_stats_nothing_found').show();
			return;
		}
		lastFreqData = results;
		var plotObj = $('#word_freq_rank_stats_plot');
		if (results.length <= 0 || results[0].length <= 0) {
			$('#word_stats_nothing_found').show();
			return;
		}
		var maxHeight = 0
		for (iRes = 0; iRes < results.length; iRes++) {
			var curMaxHeight = d3.max(results[iRes], v => v.n_words);
			if (curMaxHeight > maxHeight) {
				maxHeight = curMaxHeight;
			}
		}
		svg = d3.create("svg");
      	plotObj.append(svg);
      	plotObj.find('svg').addClass('word_meta_plot').attr("viewBox", "0 0 600 350");
		show_line_plot(results, maxHeight, 100, '%');
	}

	assign_word_stats_events();
});
