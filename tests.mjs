const tests = [[
// Test 0: No text
`<p><b></b><i></i></p><div><span></span></div>`,
[
	{ tag: 'p', children: [
		{ tag: 'b' },
		{ tag: 'i' }
	]},
	{ tag: 'div', children: [
		{ tag: 'span' }
	]}
]], [
// Test 1: Just elements
`<p>
	<b>bold content</b>
</p>`, 
[{ tag: 'p', children: [
	{ text: "\n\t" },
	{ tag: 'b', children: [
		{ text: "bold content" }
	]},
	{ text: "\n" }
]}]], [

// Test 2: An attribute
`<a href="https://google.com">Google</a>`,
[{ tag: 'a', attributes: { 'href': 'https://google.com' }, children: [
	{ text: 'Google' }
]}]], [

// Test 3: A comment
`<p>
	The world turns,
	it turns and it turns.
	Like a world it turns,
	<!-- Pause for effect... -->
	the world turns as a world would turn.
</p>`,
[{ tag: 'p', children: [
	{ text: "\n\tThe world turns,\n\tit turns and it turns.\n\tLike a world it turns,\n\t" },
	{ comment: " Pause for effect... " },
	{ text: "\n\tthe world turns as a world would turn.\n" }
]}]], [

// Test 4: Void tag
`<form>
	<label>Username: <input type="text"></label>
	<label>Password: <input type="password"></label>
	<button>Login</button>
</form>`,
[{ tag: 'form', children: [
	{ text: "\n\t" },
	{ tag: 'label', children: [
		{ text: "Username: " },
		{ tag: 'input', attributes: { 'type': "text" } },
	]},
	{ text: "\n\t" },
	{ tag: 'label', children: [
		{ text: "Password: " },
		{ tag: 'input', attributes: { 'type': "password" } },
	]},
	{ text: "\n\t" },
	{ tag: 'button', children: [
		{ text: "Login" }
	]},
	{ text: "\n" }
]}]
]];

export function check_test(result, expected) {
	if (result.length !== expected.length) {
		return false;
	}
	for (let i = 0; i < expected.length; ++i) {
		const ex = expected[i];
		const re = result[i];
		if (
			ex.comment !== re.comment ||
			ex.text !== re.text ||
			ex.tag !== re.tag
		) {
			return false;
		}
		for (const key in ex.attributes || {}) {
			if (re.attributes === undefined || ex.attributes[key] !== re.attributes[key]) {
				return false;
			}
		}
		if (ex.children !== undefined) {
			check_test(re.children, ex.children);
		} else {
			if (re.children !== undefined && re.children.length !== 0) {
				return false;
			}
		}
	}
	return true;
}

export default tests;