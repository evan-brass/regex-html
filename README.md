# How to parse HTML with Regular Expressions
I'll be using JavaScript here. With it we can write this in <100 lines of code.

## Harness
We'll start by laying out our code. I'll be using closures, but you could - and my first version did - use a class instead. We'll need a `parse_html` function, and inside we'll put a helper function called `pull` and a `parse_content` function which we'll fill in later.

If you'd like to follow along, the code and some tests are available here: https://github.com/evan-brass/regex-html

```javascript
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
		
	}
	parse_content(root);
	return root.children;
}
```

The cursor will be a pointer to a node in our DOM tree.  Tag nodes will have a tag property for their tag name, an attributes map, and a children array.  Our root node just has a children array so that it looks like a tag to the parse_content function.  When we return we return the children array because we can have multiple top level nodes in HTML.

The pull function applies a regular expression to the input and then removes whatever is matched from the input.  This assumes that our regular expressions are always anchored to the start of the string, which we'll do when we get there.  It also calls a handler function, passing it all the captures.We'll only be using 1 or 2 captures but you might have more for a more difficult language.

## Tags
The first regular expression we'll write will parse openning HTML tags.  Open tags look something like this `<tag-name>` so we'll use `/^<([a-zA-Z][a-zA-Z0-9\-]*)>/`.  Of course, we'll also need to match closing tags, which are the same but with a slash: `/^<\/([a-zA-Z][a-zA-Z0-9\-]*)>/`.  Remember, since we're matching on the beginning of the input, we need the '^' to anchor to the start of the string.

```javascript
function parse_content(cursor) {
	let run = true;
	while (run && input.length > 0) {
		// Parse an open tag
		const success = pull(/^<([a-zA-Z][a-zA-Z0-9\-]*)>/, tag => {
			const new_tag = { tag, attributes: {}, children: [] };
			cursor.children.push(new_tag);
			parse_content(new_tag);
		}) ||
		// Parse close tag
		pull(/^<\/([a-zA-Z][a-zA-Z0-9\-]*)>/, tag => {
			if (cursor.tag !== tag) {
				throw new Error("Unmatched close tag");
			}
			run = false;
		});
		if (!success) {
			throw new Error("Parse error");
		}
	}
}
```

Since our pull function returns a boolean, we can use short circuit evaluation to chain calls to pull and stop when one consumes some input. It's kinda like choice in parser combinators.

This get's us past our first test which doesn't have any text nodes:
```html
<p><b></b><i></i></p><div><span></span></div>
```

## Text Nodes
Let's add text nodes next. For simplicity, we'll assume that '<' characters don't exist in text.

```javascript
// Parse an open tag
const success = pull(/^<([a-zA-Z][a-zA-Z0-9\-]*)>/, tag => {
	const new_tag = { tag, attributes: {}, children: [] };
	cursor.children.push(new_tag);
	parse_content(new_tag);
}) ||
// Parse close tag
pull(/^<\/([a-zA-Z][a-zA-Z0-9\-]*)>/, tag => {
	if (cursor.tag.toLowerCase() !== tag.toLowerCase()) {
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
```

This gets us past our second test:
```html
<p>
	<b>bold content</b>
</p>
```

## Attributes
While we could probably extend our open tag to accomodate attributes I'd rather put it in its own function.  We'll need to adjust our open tag handler to not require a closing '>':
```javascript
pull(/^<([a-zA-Z][a-zA-Z0-9\-]*)/, tag => {
	const new_tag = { tag, attributes: {}, children: [] };
	cursor.children.push(new_tag);
	parse_attributes(new_tag);
	parse_content(new_tag);
})
```

And then we'll write our `parse_attributes` function. Please excuse the wacky while loop:
```javascript
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
```

This gets us past our 3rd test:
```html
<a href="https://google.com">Google</a>
```

# Comment Nodes
The 4th test includes a Comment node which makes us dust off our negative lookaheads. We'll just put the following after the open tag in `parse_content`:

```javascript
// Parse a comment node:
|| pull(/^<!--((?:[^-]|-(?!->))*)-->/, comment => {
	cursor.children.push({
		comment
	})
})
```

Another test down:
```html
<p>
	The world turns,
	it turns and it turns.
	Like a world it turns,
	<!-- Pause for effect... -->
	the world turns as a world would turn.
</p>
```

## Void tags
In HTML there are some tags which cannot have children. They're known as void tags and there's a list of them here: https://riptutorial.com/html/example/4736/void-elements To handle void tags we'll just skip parsing child content if the tag name is a void tag:

```javascript
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
```
```javascript
// Parse an open tag
const success = pull(/^<([a-zA-Z][a-zA-Z0-9\-]*)/, tag => {
	const new_tag = { tag, attributes: {}, children: [] };
	cursor.children.push(new_tag);
	parse_attributes(new_tag);
	if (!VOID_TAGS.includes(tag.toLowerCase())) {
		parse_content(new_tag);
	}
})
```

And with that, our tests give us a clean bill of health.
```html
<form>
	<label>Username: <input type="text"></label>
	<label>Password: <input type="password"></label>
	<button>Login</button>
</form>
```

## Conclusion
Congratulations! You just built a recursive descent parser for a simplified version of HTML!
The moral of this story is that parsing non-regular languages is pretty small step once you understand regular languages.

We did simplify HTML a lot to make our parser easier though. To be complete you'd need to handle `<!Doctypes >`, SVG, escape sequences, attributes that aren't surrounded with quotation marks, and you'd probably want your browser to handle websites that relied on bugs in previous HTML parsers or websites that just have broken HTML in a graceful way.  You'd probably also want to provide helpful error messages

The moral of the story is that building parsers isn't too hard, and just because you can't parse HTML with a *single* regular expression, that doesn't mean you can't use regular expressions in your parser.

---

Links:
1. https://regexr.com/
2. https://blog.codinghorror.com/parsing-html-the-cthulhu-way/