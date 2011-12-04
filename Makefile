TESTS = $(wildcard test/*.js)
JS_FILES = $(wildcard lib/*.js)
DOC_DEPS = $(JS_FILES:.js=.doc)

test:
	@./test/run.sh $(TESTS)

lib/%.doc: lib/%.js
	./node_modules/.bin/dox < "$<" | node docs/compile.js "$<"

%.doc.debug: lib/%.js
	./node_modules/.bin/dox --debug < "$<"

docs: $(DOC_DEPS)

.PHONY: test
