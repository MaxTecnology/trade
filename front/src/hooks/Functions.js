export function update(modalHandler, setSucess, setError) {
    setTimeout(() => {
        closeModal(modalHandler, setSucess, setError)
    }, 1000); // 2000 milissegundos = 2 segundos
}

export const closeModal = (modalHandler, setSucess, setError) => {
    const modal = document.querySelector('.modalAnimation')
    const modalOverlay = document.querySelector('.modalAnimationOverlay');

    const modalUserEdit = document.querySelector('.modalAnimationUser');
    const modalUserEditOverlay = document.querySelector('.modalAnimationUserOverlay');

    const modalEdit = document.querySelector('.modalAnimationEdit');
    const modalAnimationOverlay = document.querySelector('.modalAnimationOverlay');

    if (modalUserEdit) {
        modalUserEdit.classList.add('modalAnimationUserExit');
        modalUserEditOverlay.classList.add('modalAnimationOverlayExit');
    } else if (modalEdit) {
        modalEdit.classList.add('modalAnimationEditExit');
        modalAnimationOverlay.classList.add('modalAnimationOverlayExit');
    } else if (modal) {
        modal.classList.add('modalAnimationExit');
        modalOverlay.classList.add('modalAnimationUserOverlayExit');
    } else {
        return
    }
    setTimeout(() => {
        modalHandler()
        setSucess(false)
        setError(false)
    }, 300); // 2000 milissegundos = 2 segundos
}

export const formatarNumeroParaReal = (numero) => {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numero);
};