function flushToMixpanel(data, config) {
	const batches = sliceIntoChunks(data, config.batchSize);
	let subdomain = `api`;
	if (config.region === 'EU') subdomain = `api-eu`;
	let URL;
	if (config.record_type === 'event') URL = `https://${subdomain}.mixpanel.com/import?strict=1&project_id=${config.project_id}`;
	if (config.record_type === 'user') URL = `https://${subdomain}.mixpanel.com/engage?verbose=1`;
	if (config.record_type === 'group') URL = `https://${subdomain}.mixpanel.com/groups?verbose=1`;
	if (config.record_type === 'table') URL = `https://${subdomain}.mixpanel.com/lookup-tables/${config.lookup_table_id}?project_id=${config.project_id}`;

	const options = {
		'method': 'POST',
		'contentType': 'application/json',
		'headers': {
			Authorization: `Basic ${Utilities.base64Encode(config.auth)}`,
			Accept: 'application/json'
		},
		muteHttpExceptions: true
	};
	if (config.record_type === 'table') {
		options.method = 'PUT';
		options.contentType = `text/csv`
		options.payload = JSONtoCSV(data);
		const res = UrlFetchApp.fetch(URL, options);
		return [JSON.parse(res.getContentText())];
	}
	const responses = [];
	for (const batch of batches) {
		options.payload = JSON.stringify(batch);
		const res = UrlFetchApp.fetch(URL, options);
		responses.push(JSON.parse(res.getContentText()));
	}

	return responses;
}


//todo batch also by size
function sliceIntoChunks(arr, chunkSize) {
	const res = [];
	for (let i = 0; i < arr.length; i += chunkSize) {
		const chunk = arr.slice(i, i + chunkSize);
		res.push(chunk);
	}
	return res;
}


function JSONtoCSV(arr) {
	const array = [Object.keys(arr[0])].concat(arr);

	return array.map(it => {
		return Object.values(it).toString();
	}).join('\n');
}