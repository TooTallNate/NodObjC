TESTS = $(wildcard test/*.js)
JS_FILES = $(wildcard *.js)
DOC_DEPS = $(JS_FILES:.js=.doc)

test:
	@./test/run.sh $(TESTS)

%.doc: %.js
	./node_modules/.bin/dox < "$<" | node docs/compile.js "$<"

%.doc.debug: %.js
	./node_modules/.bin/dox --debug < "$<"

docs: $(DOC_DEPS)

.PHONY: test
