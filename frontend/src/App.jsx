import { useEffect, useState } from "react";
import "./App.css";


const API_URL = "http://localhost:5000";


const DEFAULT_ALLERGENS = [
  "peanut",
  "tree nut",
  "milk",
  "egg",
  "soy",
  "wheat",
  "fish",
  "shellfish",
  "sesame",
];


function App() {

  // ==========================================================
  // State
  // ==========================================================

  const [recipe, setRecipe] = useState("");

  const [image, setImage] = useState(null);

  const [imagePreview, setImagePreview] =
    useState(null);

  const [inputMode, setInputMode] =
    useState("recipe");

  const [allergens, setAllergens] =
    useState(DEFAULT_ALLERGENS);

  const [selectedAllergens, setSelectedAllergens] =
    useState(DEFAULT_ALLERGENS);

  const [result, setResult] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  // ==========================================================
  // Load allergies from backend
  // ==========================================================

  useEffect(() => {

    fetch(`${API_URL}/api/allergens`)

      .then((response) => {

        if (!response.ok) {
          throw new Error(
            "Could not load allergies."
          );
        }

        return response.json();

      })

      .then((data) => {

        if (
          data.allergens &&
          data.allergens.length > 0
        ) {

          setAllergens(data.allergens);

          setSelectedAllergens(
            data.allergens
          );

        }

      })

      .catch((err) => {

        console.log(
          "Using default allergens:",
          err.message
        );

      });

  }, []);


  // ==========================================================
  // Toggle allergy
  // ==========================================================

  function toggleAllergen(allergen) {

    setSelectedAllergens(
      (current) => {

        if (
          current.includes(allergen)
        ) {

          return current.filter(
            (item) =>
              item !== allergen
          );

        }

        return [
          ...current,
          allergen
        ];

      }
    );

  }


  // ==========================================================
  // Select all allergies
  // ==========================================================

  function selectAllAllergens() {

    setSelectedAllergens(
      [...allergens]
    );

  }


  // ==========================================================
  // Clear all allergies
  // ==========================================================

  function clearAllAllergens() {

    setSelectedAllergens([]);

  }


  // ==========================================================
  // Image selection
  // ==========================================================

  function handleImageChange(event) {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    // Make sure it is an image
    if (!file.type.startsWith("image/")) {

      setError(
        "Please select an image file."
      );

      return;

    }

    setImage(file);

    setImagePreview(
      URL.createObjectURL(file)
    );

    setError("");

    setResult(null);

  }


  // ==========================================================
  // Analyze typed recipe
  // ==========================================================

  async function analyzeRecipe() {

    if (!recipe.trim()) {

      setError(
        "Please enter a recipe first."
      );

      return;

    }

    if (
      selectedAllergens.length === 0
    ) {

      setError(
        "Please select at least one allergy."
      );

      return;

    }

    setLoading(true);

    setError("");

    setResult(null);


    try {

      const response =
        await fetch(
          `${API_URL}/api/analyze`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              recipe: recipe,

              allergens:
                selectedAllergens,
            }),
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.error ||
          "Unable to analyze recipe."
        );

      }


      setResult(data);

    }

    catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Could not connect to the backend."
      );

    }

    finally {

      setLoading(false);

    }

  }


  // ==========================================================
  // Analyze image
  // ==========================================================

  async function analyzeImage() {

    if (!image) {

      setError(
        "Please upload an image first."
      );

      return;

    }

    if (
      selectedAllergens.length === 0
    ) {

      setError(
        "Please select at least one allergy."
      );

      return;

    }

    setLoading(true);

    setError("");

    setResult(null);


    try {

      const formData =
        new FormData();


      formData.append(
        "image",
        image
      );


      formData.append(
        "allergens",
        selectedAllergens.join(",")
      );


      const response =
        await fetch(
          `${API_URL}/api/analyze-image`,
          {
            method: "POST",

            body: formData,
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.error ||
          "Unable to analyze image."
        );

      }


      setResult(data);

    }

    catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Could not connect to the backend."
      );

    }

    finally {

      setLoading(false);

    }

  }


  // ==========================================================
  // Clear everything
  // ==========================================================

  function reset() {

    setRecipe("");

    setImage(null);

    setImagePreview(null);

    setResult(null);

    setError("");

  }


  // ==========================================================
  // Results
  // ==========================================================

  const detectedAllergens =
    result?.allergens || {};

  const detectedCount =
    Object.keys(
      detectedAllergens
    ).length;


  const flaggedIngredients =
    Object.values(
      detectedAllergens
    ).flat();


  // ==========================================================
  // Render
  // ==========================================================

  return (

    <div className="app">


      {/* ====================================================
          Navigation
      ==================================================== */}

      <nav className="navbar">

        <div className="brand">

          <div className="brand-icon">
            🥗
          </div>

          <div>

            <h1>
              SafePlate
            </h1>

            <span>
              AI Allergy Analyzer
            </span>

          </div>

        </div>


        <div className="nav-status">

          <span className="status-dot"></span>

          AI Analyzer

        </div>

      </nav>


      {/* ====================================================
          Main
      ==================================================== */}

      <main className="container">


        {/* ==================================================
            Hero
        ================================================== */}

        <section className="hero">

          <div className="hero-text">

            <div className="eyebrow">
              AI-POWERED FOOD SAFETY
            </div>

            <h2>

              Know what's in your food

              <span>
                {" "}before you eat it.
              </span>

            </h2>

            <p>

              Upload a food label, restaurant
              menu, or recipe and let AI
              identify ingredients that may
              contain your selected allergens.

            </p>

          </div>

        </section>


        {/* ==================================================
            Allergy selection
        ================================================== */}

        <section className="card">

          <div className="section-header">

            <div>

              <h3>
                1. Select your allergies
              </h3>

              <p>
                We'll check the food against
                the allergies you select.
              </p>

            </div>


            <span className="selection-count">

              {selectedAllergens.length}
              {" "}selected

            </span>

          </div>


          <div className="allergy-actions">

            <button
              onClick={
                selectAllAllergens
              }
            >
              Select all
            </button>

            <button
              onClick={
                clearAllAllergens
              }
            >
              Clear all
            </button>

          </div>


          <div className="allergy-grid">

            {allergens.map(
              (allergen) => {

                const selected =
                  selectedAllergens.includes(
                    allergen
                  );


                return (

                  <button

                    key={allergen}

                    className={
                      `allergy ${
                        selected
                          ? "selected"
                          : ""
                      }`
                    }

                    onClick={() =>
                      toggleAllergen(
                        allergen
                      )
                    }

                  >

                    <span className="check">

                      {selected
                        ? "✓"
                        : ""}

                    </span>

                    {formatAllergen(
                      allergen
                    )}

                  </button>

                );

              }
            )}

          </div>

        </section>


        {/* ==================================================
            Input card
        ================================================== */}

        <section className="card">

          <div className="section-header">

            <div>

              <h3>
                2. Analyze your food
              </h3>

              <p>
                Upload an image or enter
                the recipe manually.
              </p>

            </div>

          </div>


          {/* Tabs */}

          <div className="input-tabs">

            <button

              className={
                inputMode === "image"
                  ? "tab active"
                  : "tab"
              }

              onClick={() =>
                setInputMode("image")
              }

            >
              📷 Upload Image

            </button>


            <button

              className={
                inputMode === "recipe"
                  ? "tab active"
                  : "tab"
              }

              onClick={() =>
                setInputMode("recipe")
              }

            >
              ✏️ Enter Recipe

            </button>

          </div>


          {/* =================================================
              IMAGE MODE
          ================================================= */}

          {inputMode === "image" && (

            <div className="upload-area">


              <label

                htmlFor="image-upload"

                className="upload-box"

              >

                <div className="upload-icon">
                  📷
                </div>


                <strong>
                  Upload a food image
                </strong>


                <span>
                  Recipe, restaurant menu,
                  or packaged food label
                </span>


                <span className="upload-button">
                  Choose Image
                </span>

              </label>


              <input

                id="image-upload"

                type="file"

                accept="
                  image/png,
                  image/jpeg,
                  image/jpg,
                  image/webp
                "

                onChange={
                  handleImageChange
                }

                hidden

              />


              {/* Image preview */}

              {imagePreview && (

                <div className="preview">

                  <img

                    src={imagePreview}

                    alt="Uploaded food"

                  />


                  <div className="preview-info">

                    <strong>
                      {image?.name}
                    </strong>

                    <span>
                      Ready for OCR
                    </span>

                  </div>

                </div>

              )}


              {error && (

                <div className="error">
                  ⚠️ {error}
                </div>

              )}


              <button

                className="analyze-button"

                onClick={
                  analyzeImage
                }

                disabled={
                  !image ||
                  loading
                }

              >

                {loading
                  ? "📖 Reading image..."
                  : "🔍 Scan & Analyze"}

              </button>


            </div>

          )}


          {/* =================================================
              RECIPE MODE
          ================================================= */}

          {inputMode === "recipe" && (

            <>

              <textarea

                value={recipe}

                onChange={(event) =>
                  setRecipe(
                    event.target.value
                  )
                }

                placeholder={`Example:

2 cups all-purpose flour
1 cup whole milk
2 large eggs
4 tablespoons butter
1 teaspoon vanilla extract
1/2 cup sugar`}

              />


              {error && (

                <div className="error">
                  ⚠️ {error}
                </div>

              )}


              <div className="input-actions">

                <button

                  className="clear-button"

                  onClick={reset}

                >
                  Clear
                </button>


                <button

                  className="analyze-button"

                  onClick={
                    analyzeRecipe
                  }

                  disabled={loading}

                >

                  {loading
                    ? "Analyzing..."
                    : "🔍 Analyze Recipe"}

                </button>

              </div>

            </>

          )}

        </section>


        {/* ==================================================
            Results
        ================================================== */}

        {result && (

          <section className="results">


            {/* Results heading */}

            <div className="results-header">

              <div>

                <div className="eyebrow">
                  ANALYSIS COMPLETE
                </div>

                <h2>
                  Food analysis
                </h2>

              </div>


              {detectedCount === 0 ? (

                <div className="safe-badge">

                  ✓ No selected allergens
                  detected

                </div>

              ) : (

                <div className="danger-badge">

                  ⚠ {detectedCount}

                  {" "}potential allergen
                  {detectedCount !== 1
                    ? "s"
                    : ""}

                  {" "}found

                </div>

              )}

            </div>


            {/* =================================================
                OCR text
            ================================================= */}

            {result.ocr_text && (

              <div className="ocr-card">

                <div className="ocr-header">

                  <div>

                    <h3>
                      📄 Text detected
                    </h3>

                    <p>
                      This is the text extracted
                      from your image.
                    </p>

                  </div>


                  <span className="ocr-badge">
                    OCR
                  </span>

                </div>


                <pre className="ocr-text">

                  {result.ocr_text}

                </pre>

              </div>

            )}


            {/* =================================================
                Warning
            ================================================= */}

            {detectedCount > 0 && (

              <div className="warning">

                <div className="warning-icon">
                  ⚠️
                </div>


                <div>

                  <h3>
                    Potential allergens detected
                  </h3>

                  <p>

                    The analyzer found ingredients
                    associated with your selected
                    allergy profile. Review the
                    original food label carefully
                    before consuming.

                  </p>

                </div>

              </div>

            )}


            {/* =================================================
                Allergen cards
            ================================================= */}

            {detectedCount > 0 && (

              <div className="allergen-results">

                {Object.entries(
                  detectedAllergens
                ).map(
                  ([allergen, ingredients]) => (

                    <div
                      className="allergen-card"
                      key={allergen}
                    >

                      <div className="allergen-title">

                        <span>
                          ⚠️
                        </span>

                        <strong>
                          {formatAllergen(
                            allergen
                          )}
                        </strong>

                      </div>


                      <div className="ingredient-list">

                        {ingredients.map(
                          (
                            ingredient,
                            index
                          ) => (

                            <span
                              className="ingredient-tag"
                              key={
                                `${ingredient}-${index}`
                              }
                            >

                              {ingredient}

                            </span>

                          )
                        )}

                      </div>

                    </div>

                  )
                )}

              </div>

            )}


            {/* =================================================
                Detected ingredients
            ================================================= */}

            <div className="ingredients-section">

              <h3>
                Detected ingredients
              </h3>

              <p>
                Ingredients identified by
                the recipe AI model.
              </p>


              {result.ingredients &&
              result.ingredients.length > 0 ? (

                <div className="ingredient-table">

                  {result.ingredients.map(
                    (
                      ingredient,
                      index
                    ) => {

                      const isAllergen =
                        flaggedIngredients.includes(
                          ingredient.text
                        );


                      return (

                        <div

                          className={
                            `ingredient-row ${
                              isAllergen
                                ? "flagged"
                                : ""
                            }`
                          }

                          key={
                            `${ingredient.text}-${index}`
                          }

                        >

                          <span>

                            {isAllergen
                              ? "⚠️"
                              : "✓"}

                          </span>


                          <strong>

                            {ingredient.text}

                          </strong>


                          <span className="confidence">

                            {Math.round(
                              ingredient.confidence *
                              100
                            )}

                            % confidence

                          </span>

                        </div>

                      );

                    }
                  )}

                </div>

              ) : (

                <div className="no-ingredients">

                  No food ingredients were
                  detected.

                </div>

              )}

            </div>


            {/* =================================================
                Alternatives
            ================================================= */}

            {detectedCount > 0 && (

              <div className="alternative-card">

                <div className="alternative-icon">
                  💡
                </div>


                <div>

                  <h3>
                    Safer alternatives
                  </h3>

                  <p>

                    We can use an AI assistant
                    to suggest substitutions for
                    the flagged ingredients.

                  </p>


                  <button

                    className="alternative-button"

                    onClick={() =>
                      alert(
                        "AI alternatives will be added next!"
                      )
                    }

                  >

                    Suggest Alternatives

                  </button>

                </div>

              </div>

            )}

          </section>

        )}


        {/* ==================================================
            Disclaimer
        ================================================== */}

        <footer>

          <strong>
            ⚕️ Safety note
          </strong>

          <p>

            This tool is designed to help
            identify potential allergens and
            is not a substitute for medical
            advice or careful ingredient
            verification. Always check product
            labels and consult a qualified
            healthcare professional regarding
            food allergies.

          </p>

        </footer>


      </main>

    </div>

  );
}


// ============================================================
// Helper
// ============================================================

function formatAllergen(value) {

  return value
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );

}


export default App;
