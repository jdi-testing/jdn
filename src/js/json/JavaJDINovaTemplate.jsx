const JavaJDINovaTemplate = {
  package: "",
  siteName: "",
  nameCase: "camelCase",
  typeCase: "PascalCase",
  site: `package {{package}};
	
import com.jdiai.annotations.*;
import {{package}}.pages.*;
import {{library_package}}.*;

@Site("{{domain}}")
public class {{siteName}} {
{{pages}}
}
`,

  siteElement: `    @Url("{{url}}") @Title("{{title}}") 
    public static {{type}} {{name}};`,
  page: `package {{package}}.pages;

import com.jdiai.*;
import com.jdiai.annotations.*;
import {{package}}.sections.*;
import {{library_package}}.*;

public class {{type}} extends WebPage {
{{elements}}	
}
`,
  pageElementCss: `    @UI("{{locator}}") public {{type}} {{name}};`,
  pageElementXPath: `    @UI("{{locator}}") public {{type}} {{name}};`,
  pageElementComplex: ``,
  locatorCss: `"{{locator}}",`,
  locatorXPath: `"{{locator}}",`,
  section: `package {{package}}.sections;

import com.jdiai.*;
import com.jdiai.annotations.*;
import {{library_package}}.*;

public class {{type}} extends Section {
{{elements}}	
}
`,

  form: `package {{package}}.sections;

import com.jdiai.*;
import com.jdiai.annotations.*;
import {{package}}.entities.*;
import {{library_package}}.*;

public class {{type}} extends Form<{{data}}> {
{{elements}}	
}
`,
  data: `package {{package}}.entities;

import com.jdiai.tools.DataClass;

public class {{type}} extends DataClass<{{type}}> {
{{elements}}
}
`,
  dataElement: `    public String {{name}};`,
};

export { JavaJDINovaTemplate };
