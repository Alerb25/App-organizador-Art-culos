import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([]) // Estado para guardar las taxonomias
  const [searchTerm, setSearchTerm] = useState('') // Estado para el filtro
  const [selectedCat, setSelectedCat] = useState('') // Estado para el filtro de categoria
  const DRUPAL_BASE_URL = process.env.DRUPAL_BASE_URL //para que el boton de leer mas funcione
  const [showCreateForm, setShowCreateForm] = useState(false) //para el boton crear
  const [createForm, setCreateForm] = useState({ title: '', body: '' })

  // Estado para guardar el token de seguridad
  const [token, setToken] = useState(localStorage.getItem('access_token') || null)

  //  Estado para controlar el formulario de login (mostrar/ocultar)
  const [showLoginForm, setShowLoginForm] = useState(false)
  //  Estado para los campos del formulario de login
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  //  Estado para mostrar error de credenciales incorrectas
  const [loginError, setLoginError] = useState('')

  //  Estado para controlar el post que se esta editando (null = ninguno)
  const [editingPost, setEditingPost] = useState(null)
  //  Estado para los campos del formulario de edición
  const [editForm, setEditForm] = useState({ title: '', body: '' })

  // Credenciales validas para acceder como editor
  const VALID_USERNAME = process.env.VALID_USERNAME
  const VALID_PASSWORD = process.env.VALID_PASSWORD

  // Función para obtener el token (lo que hacías con el CURL)
  const login = async () => {
    //  Primero comprobamos que las credenciales del formulario sean correctas
    if (loginForm.username !== VALID_USERNAME || loginForm.password !== VALID_PASSWORD) {
      setLoginError('Usuario o contraseña incorrectos.')
      return
    }

    setLoginError('')

    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', '4RFrA2He9cR5it02CJa-TPCYeGuJNXO9t2Ah_4SXCPk');
    formData.append('client_secret', 'hola123');
    formData.append('scope', 'scope_json');

    try {
      const response = await fetch(`${DRUPAL_BASE_URL}/oauth/token`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.access_token) {
        setToken(data.access_token);
        localStorage.setItem('access_token', data.access_token);
        //  Ocultamos el formulario de login al tener token
        setShowLoginForm(false)
        setLoginForm({ username: '', password: '' })
      }
    } catch (error) {
      console.error("Error al autenticar", error);
    }
  }

  // Función para eliminar un artículo
  const deletePost = async (uuid) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este artículo?")) return;

    try {
      const response = await fetch(`${DRUPAL_BASE_URL}/jsonapi/node/article/${uuid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/vnd.api+json',
        },
      });

      //  Si el token caducó (401), avisamos al usuario para que vuelva a hacer login
      if (response.status === 401) {
        alert("Tu sesión ha caducado. Por favor vuelve a verificarte como Editor.");
        setToken(null);
        localStorage.removeItem('access_token');
        return;
      }

      if (response.status === 204) {
        setPosts(posts.filter(post => post.id !== uuid));
        alert("Artículo eliminado correctamente");
      }
    } catch (error) {
      console.error("Error al eliminar", error);
    }
  }

  //  Función para abrir el formulario de edición con los datos actuales del post
  const openEditForm = (post) => {
    setEditingPost(post.id)
    setEditForm({
      title: post.attributes.title || '',
      // body.value contiene el HTML sin procesar, ideal para editar
      body: post.attributes.body?.value || '',
    })
  }

  //  Función para enviar la edición a Drupal vía PATCH (JSON:API)
  const submitEdit = async (uuid) => {
    try {
      const response = await fetch(`${DRUPAL_BASE_URL}/jsonapi/node/article/${uuid}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/vnd.api+json',
        },
        // JSON:API requiere este formato exacto para PATCH
        body: JSON.stringify({
          data: {
            type: 'node--article',
            id: uuid,
            attributes: {
              title: editForm.title,
              body: {
                value: editForm.body,
                format: 'basic_html', // ajusta al formato de texto que uses en Drupal
              },
            },
          },
        }),
      });

      // Si el token caducó (401), avisamos al usuario para que vuelva a hacer login
      if (response.status === 401) {
        alert("Tu sesión ha caducado. Por favor vuelve a verificarte como Editor.");
        setToken(null);
        localStorage.removeItem('access_token');
        return;
      }

      if (response.ok) {
        const updated = await response.json();
        // Actualizamos el post en el estado local para que se refleje sin recargar
        setPosts(posts.map(post =>
          post.id === uuid
            ? { ...post, attributes: { ...post.attributes, ...updated.data.attributes } }
            : post
        ))
        setEditingPost(null)
        alert("Artículo actualizado correctamente");
      } else {
        const err = await response.json();
        console.error("Error en la respuesta de Drupal:", err);
        alert("Error al actualizar el artículo. Revisa la consola.");
      }
    } catch (error) {
      console.error("Error al editar", error);
    }
  }
  const createPost = async () => {
    try {
      const response = await fetch(`${DRUPAL_BASE_URL}/jsonapi/node/article`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/vnd.api+json',
        },
        body: JSON.stringify({
          data: {
            type: 'node--article',
            attributes: {
              title: createForm.title,
              body: {
                value: createForm.body,
                format: 'basic_html',
              },
            },
          },
        }),
      })

      if (response.status === 401) {
        alert("Tu sesión ha caducado. Por favor vuelve a verificarte como Editor.")
        setToken(null)
        localStorage.removeItem('access_token')
        return
      }

      if (response.ok) {
        const created = await response.json()
        setPosts([...posts, created.data])         // añade el nuevo post al listado
        setCreateForm({ title: '', body: '' })
        setShowCreateForm(false)
        alert("Artículo creado correctamente")
      } else {
        const err = await response.json()
        console.error("Error al crear:", err)
        alert("Error al crear el artículo. Revisa la consola.")
      }
    } catch (error) {
      console.error("Error al crear", error)
    }
  }
  useEffect(() => {
    // conecta usando la url y hace el fetch que lo que nos va a devolver es una archivo json con los datos.
    const url = `${DRUPAL_BASE_URL}/jsonapi/node/article?include=field_tags`

    fetch(url)
      .then(response => response.json())
      .then(json => {
        setPosts(json.data)
        // Guardamos las taxonomias
        if (json.included) {
          const taxonomyTerms = json.included.filter(item => item.type === 'taxonomy_term--noticias')
          setCategories(taxonomyTerms)
        }
      })
      .catch(error => console.error("Error cargando Drupal", error))
  }, [])

  // Lógica de filtrado por titulo y por taxonomia
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.attributes.title.toLowerCase().includes(searchTerm.toLowerCase())

    // Obtenemos el ID de la categoria que tiene este post asignada
    const postTaxonomyId = post.relationships.field_tags?.data?.id
    const matchesCategory = selectedCat === '' || postTaxonomyId === selectedCat

    return matchesSearch && matchesCategory
  })

  return (
    // aqui va el html
    <div className="container">
      <h1>Nuestros Artículos</h1>

      {/*  Lógica del botón de login / cerrar sesión */}
      {!token ? (
        <div style={{ marginBottom: '20px' }}>
          {/* Si el formulario no está visible, mostramos el botón para abrirlo */}
          {!showLoginForm ? (
            <button onClick={() => setShowLoginForm(true)}>
              Verificarse como Editor
            </button>
          ) : (
            /* Si el formulario está visible, mostramos los inputs y el botón de entrar */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '280px' }}>
              <input
                type="text"
                placeholder="Usuario"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                style={{ padding: '6px', fontSize: '14px' }}
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                //  Permitir hacer login pulsando Enter
                onKeyDown={(e) => { if (e.key === 'Enter') login() }}
                style={{ padding: '6px', fontSize: '14px' }}
              />
              {/*  Mensaje de error si las credenciales no coinciden */}
              {loginError && (
                <p style={{ color: 'red', margin: 0, fontSize: '13px' }}>{loginError}</p>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={login}>Entrar</button>
                <button
                  onClick={() => {
                    setShowLoginForm(false)
                    setLoginForm({ username: '', password: '' })
                    setLoginError('')
                  }}
                  style={{ backgroundColor: '#888', color: 'white' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => { setToken(null); localStorage.removeItem('access_token') }}
          style={{ marginBottom: '20px' }}
        >
          Cerrar Sesión
        </button>
      )}
      {token && (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{ backgroundColor: '#5cb85c', color: 'white' }}
          >
            {showCreateForm ? 'Cancelar' : '+ Crear artículo'}
          </button>

          {showCreateForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px', marginTop: '10px' }}>
              <input
                type="text"
                placeholder="Título del artículo"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                style={{ padding: '6px', fontSize: '14px' }}
              />
              <textarea
                placeholder="Cuerpo del artículo"
                value={createForm.body}
                onChange={(e) => setCreateForm({ ...createForm, body: e.target.value })}
                rows={5}
                style={{ padding: '6px', fontSize: '14px' }}
              />
              <button
                onClick={createPost}
                style={{ backgroundColor: '#5cb85c', color: 'white' }}
              >
                Publicar artículo
              </button>
            </div>
          )}
        </div>
      )}

      <div className="filters">
        <input
          type="text"
          placeholder="Buscar artículos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select
          className="category-select"
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.attributes.name}
            </option>
          ))}
        </select>
      </div>

      <div className="post-grid">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => {
            // Lógica para construir la URL de redirección
            // Si tiene alias (ej: /mi-post), lo usamos. Si no, usamos /node/ID
            const pathAlias = post.attributes.path.alias;
            const nid = post.attributes.drupal_internal__nid;
            const finalUrl = pathAlias
              ? `${DRUPAL_BASE_URL}${pathAlias}`
              : `${DRUPAL_BASE_URL}/node/${nid}`;

            return (
              <article key={post.id} className="post-card">
                <h3>{post.attributes.title}</h3>

                <div className="post-body">
                  {post.attributes.body?.processed ? (
                    <div dangerouslySetInnerHTML={{ __html: post.attributes.body.processed.substring(0, 100) + '...' }} />
                  ) : (
                    <p>Sin descripción disponible.</p>
                  )}
                </div>

                {/*  Formulario de edición inline, solo visible cuando este post esta siendo editado */}
                {editingPost === post.id && (
                  <div className="edit-form" style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      placeholder="Título"
                      style={{ padding: '6px', fontSize: '14px' }}
                    />
                    <textarea
                      value={editForm.body}
                      onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                      placeholder="Cuerpo del artículo"
                      rows={4}
                      style={{ padding: '6px', fontSize: '14px' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => submitEdit(post.id)}
                        style={{ backgroundColor: '#5cb85c', color: 'white' }}
                      >
                        Guardar cambios
                      </button>
                      <button
                        onClick={() => setEditingPost(null)}
                        style={{ backgroundColor: '#888', color: 'white' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Cambiamos el button por un enlace <a> con estilo de botón */}
                <div className="post-actions">
                  <a
                    href={finalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="read-more-link"
                  >
                    Leer más
                  </a>

                  {/* Botones de Editar y Eliminar solo si hay token */}
                  {token && (
                    <div className="admin-controls" style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => openEditForm(post)}
                        className="edit-btn"
                        style={{ backgroundColor: '#e1ad01' }}
                      >
                        {/* Si ya estamos editando este post, el botón muestra "Cancelar edición" */}
                        {editingPost === post.id ? 'Cancelar edición' : 'Editar'}
                      </button>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="delete-btn"
                        style={{ backgroundColor: '#d9534f', color: 'white' }}
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <p>No se encontraron artículos.</p>
        )}
      </div>
    </div>
  )
}

export default App