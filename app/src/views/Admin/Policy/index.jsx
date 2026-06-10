import React, { useEffect, useState } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { useFirestore } from '@/hooks/useFirestore'
import { useSelector } from 'react-redux'
import { selectCategory } from '@/store/slices/filtersSlice'

function Policy() {
  const [content, setContent] = useState('')
  const category = useSelector(selectCategory);
  const [id, setId] = useState("warranty")
  const { getAllDocs } = useFirestore(null, '07-policy')
  const [titlePost, setTitlePost] = useState("")
  const [policyInfo, setPolicyInfo] = useState({})

  useEffect(() => {
    switch (category) {
      case "Chính sách mua hàng":
        setId("purchase");
        break;
      case "Chính sách bảo hành":
        setId("warranty");
        break;
      case "Chính sách bảo mật":
        setId("privacy");
        break;
      case "Thu cũ đổi mới":
        setId("exchange")
        break;
    }
  }, [category]);

  useEffect(() => {
    const fetchPolicy = async () => {
      const docs = await getAllDocs()
      if (docs.length > 0) {
        const policy = docs.find(item => item.id === id)
        setPolicyInfo(policy || {})
      }
    }
    fetchPolicy()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (policyInfo) {
      setTitlePost(policyInfo.title ?? '');
      setContent(policyInfo.content ?? '');
    }
  }, [policyInfo]);

  const handleEditorChange = (content) => {
    setContent(content)
  }

  const handleSave = async () => {
    const updatedData = {
      title: titlePost,
      content: content,
    };
    console.log('Updated data:', updatedData);
  }

  const handleClear = () => {
    setContent('')
    setTitlePost('')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Chỉnh sửa {category}</h1>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tên bài viết:</label>
        <input
          type="text"
          value={titlePost}
          onChange={(e) => setTitlePost(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung bài viết:</label>
        <div className="min-h-[500px]">
          <Editor
            apiKey="b4ryhxq7nnx5nwmr46ft5ifo6da5zw2i6g7lthivcyr9acot"
            value={content}
            onEditorChange={handleEditorChange}
            init={{
              height: 500,
              menubar: 'file edit view insert format tools table help',
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'help', 'wordcount',
                'emoticons', 'template', 'pagebreak', 'nonbreaking', 'directionality',
                'visualchars', 'textcolor', 'colorpicker', 'textpattern',
                'hr', 'paste', 'autosave', 'save', 'print', 'spellchecker', 'contextmenu'
              ],
              toolbar: 'undo redo | blocks | ' +
                'bold italic underline strikethrough | forecolor backcolor | ' +
                'alignleft aligncenter alignright alignjustify | ' +
                'bullist numlist outdent indent | ' +
                'removeformat | help | ' +
                'fontsize fontfamily | ' +
                'link image media table | ' +
                'code fullscreen preview | ' +
                'emoticons charmap hr pagebreak | ' +
                'searchreplace visualblocks visualchars | ' +
                'template insertdatetime print',
              font_size_formats: '8pt 10pt 12pt 14pt 16pt 18pt 20pt 22pt 24pt 26pt 28pt 30pt 32pt 34pt 36pt 40pt 44pt 48pt 52pt 56pt 60pt 64pt 68pt 72pt',
              font_family_formats: 'Andale Mono=andale mono,times; Arial=arial,helvetica,sans-serif; Arial Black=arial black,avant garde; Book Antiqua=book antiqua,palatino; Comic Sans MS=comic sans ms,sans-serif; Courier New=courier new,courier; Georgia=georgia,palatino; Helvetica=helvetica; Impact=impact,chicago; Symbol=symbol; Tahoma=tahoma,arial,helvetica,sans-serif; Terminal=terminal,monaco; Times New Roman=times new roman,times; Trebuchet MS=trebuchet ms,geneva; Verdana=verdana,geneva; Webdings=webdings; Wingdings=wingdings,zapf dingbats',
              content_style: 'body { font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; }',
              branding: false,
              promotion: false,
              mobile: {
                toolbar_mode: 'sliding',
                plugins: 'autosave lists link table',
              },
              image_advtab: true,
              paste_data_images: true,
              automatic_uploads: true,
              file_picker_types: 'image',
              images_upload_handler: async (blobInfo) => {
                return new Promise((resolve, reject) => {
                  const reader = new FileReader()
                  reader.onload = () => {
                    resolve(reader.result)
                  }
                  reader.onerror = () => {
                    reject('Image upload failed')
                  }
                  reader.readAsDataURL(blobInfo.blob())
                })
              },
              resize: true,
              elementpath: true,
              statusbar: true,
            }}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          Xóa hết
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800"
        >
          Lưu
        </button>
      </div>

    </div>
  )
}

export default Policy
