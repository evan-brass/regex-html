const VOID_TAGS = [
	// List from: https://riptutorial.com/html/example/4736/void-elements
	'area',
	'base',
	'br',
	'hr',
	'img',
	'input',
	'link',
	'meta',
	'param',
	'command',
	'keygen',
	'source'
];

export default function parse_html(input) {
	const root = { children: [] };
	function pull(regex, handler = () => {}) {
		const match = regex.exec(input);
		if (match !== null) {
			const [full_match, ...captures] = match;
			input = input.substr(full_match.length);
			handler(...captures);
			return true;
		} else {
			return false;
		}
	}
	function parse_content(cursor) {
		let run = true;
		while (run && input.length > 0) {
			// Parse an open tag
			const success = pull(/^<([a-zA-Z][a-zA-Z0-9\-]*)/, tag => {
				const new_tag = { tag, attributes: {}, children: [] };
				cursor.children.push(new_tag);
				parse_attributes(new_tag);
				if (!VOID_TAGS.includes(tag.toLowerCase())) {
					parse_content(new_tag);
				}
			})
			// Parse a comment node:
			|| pull(/^<!--((?:[^-]|-(?!->))*)-->/, comment => {
				cursor.children.push({
					comment
				})
			})
			// Parse close tag
			|| pull(/^<\/([a-zA-Z][a-zA-Z0-9\-]*)>/, tag => {
				if (cursor.tag !== tag) {
					throw new Error("Unmatched close tag");
				}
				run = false;
			})
			// Parse a text node
			|| pull(/^([^<]+)/, text => {
				cursor.children.push({
					text
				});
			});
			if (!success) {
				throw new Error("Parse error");
			}
		}
	}
	function parse_attributes(cursor) {
		while(pull(/^\s+([a-zA-Z][a-zA-Z0-9\-]+)="([^"]*)"/, (
			name,
			value
		) => {
			cursor.attributes[name] = value;
		})) {}
		if (!pull(/^\s*>/)) {
			throw new Error("Malformed open tag");
		}
	}
	parse_content(root);
	return root.children;
}