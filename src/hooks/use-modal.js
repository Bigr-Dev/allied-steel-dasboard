// oncreate handler
export const onCreate = (setModalOpen, modalOpen, setHref) => {
  return (href) => {
    setModalOpen(!modalOpen)
    setHref(href)
  }
}

// onEdit handler
export const onEdit = (setModalOpen, modalOpen, setId) => {
  return ({ id }) => {
    setModalOpen(!modalOpen)

    if (id) {
      setId(id)
    }
  }
}

// onDelete handler
export const onDelete = (setAlertOpen, alertOpen, setId) => {
  return ({ id }) => {
    setAlertOpen(!alertOpen)
    if (id) {
      setId(id)
    }
  }
}
