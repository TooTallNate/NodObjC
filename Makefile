NODE ?= node
DOX ?= $(NODE) ./node_modules/.bin/dox
TESTS := $(wildcard test/core/*.js test/*.js)
JS_FILES := $(wildcard lib/*.js)
DOC_DEPS := $(JS_FILES:.js=.html)
DOC_DEPS := $(DOC_DEPS:lib/%=docs/%)

# The name of the individual pages
export PAGES=$(notdir $(basename $(JS_FILES)))

test:
	@./test/run.sh $(TESTS)

docs/%.html: lib/%.js
	$(DOX) --raw \
	  < $< \
	  | $(NODE) docs/compile.js $(notdir $(basename $^)) \
	  > $@

%.doc: lib/%.js
	$(NODE) $(DOX) --raw --debug < $<

docs: $(DOC_DEPS)

docclean:
	rm -fv docs/*.html

gh-pages: docclean docs
	rm -rf /tmp/NodObjC_docs \
		&& cp -Lrf docs /tmp/NodObjC_docs \
		&& rm /tmp/NodObjC_docs/compile.js /tmp/NodObjC_docs/template.jade \
		&& git checkout gh-pages \
		&& cp -Lrf /tmp/NodObjC_docs/* . \
		&& echo "done"

.PHONY: test docs gh-pages
