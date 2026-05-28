import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react';

import axiosInstance from '../../api/axios';

const DOCS = [
  {
    id: 'license',
    label: 'Driving License',
    icon: '🪪',
    desc: 'Upload front side of your driving license',
  },
  {
    id: 'rc',
    label: 'Vehicle RC Book',
    icon: '📋',
    desc: 'Upload registration certificate of vehicle',
  },
];

const DriverDocuments = () => {
  const navigate = useNavigate();

  const [uploads, setUploads] = useState({});
  const [uploading, setUploading] = useState({});
  const [msgs, setMsgs] = useState({});
  const [preview, setPreview] = useState({});

  const handleUpload = async (docType, file) => {
    if (!file) return;

    setUploading((u) => ({
      ...u,
      [docType]: true,
    }));

    setMsgs((m) => ({
      ...m,
      [docType]: '',
    }));

    try {
      const formData = new FormData();

      formData.append('document', file);
      formData.append('docType', docType);

      const res = await axiosInstance.post(
        '/driver/documents',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setUploads((u) => ({
        ...u,
        [docType]: res.data.fileUrl,
      }));

      setMsgs((m) => ({
        ...m,
        [docType]:
          'Uploaded successfully. Awaiting admin verification.',
      }));

      if (file.type.includes('image')) {
        setPreview((p) => ({
          ...p,
          [docType]: URL.createObjectURL(file),
        }));
      }

      const user = JSON.parse(
        localStorage.getItem('user') || '{}'
      );

      localStorage.setItem(
        'user',
        JSON.stringify({
          ...user,
          ...res.data.driver,
        })
      );
    } catch (err) {
      setMsgs((m) => ({
        ...m,
        [docType]:
          err.response?.data?.message ||
          'Upload failed',
      }));
    } finally {
      setUploading((u) => ({
        ...u,
        [docType]: false,
      }));
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#070b14]">

      {/* BACKGROUND ORBS */}

      <div className="absolute top-[-100px] left-[-100px] w-[280px] h-[280px] rounded-full bg-yellow-500/20 blur-[90px]" />

      <div className="absolute bottom-[-120px] right-[-100px] w-[280px] h-[280px] rounded-full bg-indigo-500/20 blur-[100px]" />

      <div className="absolute top-[40%] left-[40%] w-[220px] h-[220px] rounded-full bg-emerald-500/10 blur-[100px]" />

      {/* CONTENT */}

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* HEADER */}

        <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070b14]/70 border-b border-white/5">

          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">

            <div className="flex items-center gap-3">

              <button
                onClick={() => navigate(-1)}
                className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <ArrowLeft
                  size={18}
                  className="text-white"
                />
              </button>

              <div>
                <h1 className="text-white text-lg sm:text-xl font-extrabold">
                  Driver Documents
                </h1>

                <p className="text-white/40 text-xs sm:text-sm mt-1">
                  Upload required verification documents
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
              <ShieldCheck
                size={16}
                className="text-emerald-400"
              />

              <span className="text-emerald-400 text-sm font-semibold">
                Secure Upload
              </span>
            </div>
          </div>
        </header>

        {/* BODY */}

        <main className="flex-1 w-full">

          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

            {/* TOP INFO CARD */}

            <div className="mb-6 sm:mb-8 rounded-3xl border border-yellow-400/20 bg-yellow-400/10 backdrop-blur-xl p-5 sm:p-6">

              <div className="flex gap-4 items-start">

                <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center shrink-0">
                  <AlertCircle
                    size={22}
                    className="text-yellow-300"
                  />
                </div>

                <div>
                  <h2 className="text-yellow-300 text-base sm:text-lg font-bold">
                    Verification Required
                  </h2>

                  <p className="text-yellow-200/70 text-sm leading-relaxed mt-2">
                    Upload clear images or PDF files of
                    your documents. Our admin team usually
                    verifies documents within 24 hours.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-4">

                    <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-medium">
                      Max File Size: 5MB
                    </div>

                    <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-medium">
                      JPG / PNG / PDF
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DOCUMENT GRID */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {DOCS.map((doc) => (
                <div
                  key={doc.id}
                  className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] backdrop-blur-2xl hover:border-yellow-400/20 transition-all duration-300"
                >

                  {/* GLOW */}

                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-gradient-to-br from-yellow-400/5 via-transparent to-orange-500/5 pointer-events-none" />

                  <div className="relative z-10 p-5 sm:p-6">

                    {/* TOP */}

                    <div className="flex items-start justify-between gap-4 mb-6">

                      <div className="flex gap-4">

                        <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shrink-0">
                          {doc.icon}
                        </div>

                        <div>
                          <h3 className="text-white text-lg font-bold">
                            {doc.label}
                          </h3>

                          <p className="text-white/45 text-sm leading-relaxed mt-2">
                            {doc.desc}
                          </p>
                        </div>
                      </div>

                      {uploads[doc.id] && (
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <CheckCircle2
                            size={18}
                            className="text-emerald-400"
                          />
                        </div>
                      )}
                    </div>

                    {/* PREVIEW */}

                    {preview[doc.id] && (
                      <div className="mb-5 overflow-hidden rounded-2xl border border-white/10">
                        <img
                          src={preview[doc.id]}
                          alt="preview"
                          className="w-full h-52 object-cover"
                        />
                      </div>
                    )}

                    {/* FILE STATUS */}

                    {uploads[doc.id] && (
                      <div className="flex items-center gap-2 mb-5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3">
                        <CheckCircle2 size={16} />

                        <span className="text-sm font-semibold">
                          Uploaded Successfully
                        </span>
                      </div>
                    )}

                    {/* UPLOAD BUTTON */}

                    <label
                      className={`
                        relative
                        flex
                        flex-col
                        items-center
                        justify-center
                        gap-3
                        w-full
                        min-h-[150px]
                        rounded-3xl
                        border-2
                        border-dashed
                        cursor-pointer
                        transition-all
                        duration-300

                        ${
                          uploading[doc.id]
                            ? 'border-white/10 bg-white/5'
                            : 'border-white/15 bg-white/[0.02] hover:border-yellow-400/40 hover:bg-yellow-400/[0.03]'
                        }
                      `}
                    >

                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        disabled={uploading[doc.id]}
                        onChange={(e) =>
                          handleUpload(
                            doc.id,
                            e.target.files[0]
                          )
                        }
                      />

                      {uploading[doc.id] ? (
                        <>
                          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />

                          <p className="text-white/60 text-sm font-medium">
                            Uploading document...
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">

                            {uploads[doc.id] ? (
                              <FileText
                                size={28}
                                className="text-yellow-300"
                              />
                            ) : (
                              <Upload
                                size={28}
                                className="text-white/70"
                              />
                            )}
                          </div>

                          <div className="text-center">

                            <h4 className="text-white font-bold text-sm sm:text-base">
                              {uploads[doc.id]
                                ? 'Replace Document'
                                : 'Choose File'}
                            </h4>

                            <p className="text-white/40 text-xs mt-2">
                              Drag & drop or browse files
                            </p>
                          </div>
                        </>
                      )}
                    </label>

                    {/* MESSAGE */}

                    {msgs[doc.id] && (
                      <div
                        className={`
                          mt-4
                          rounded-2xl
                          px-4
                          py-3
                          text-sm
                          font-medium
                          border

                          ${
                            msgs[doc.id].includes(
                              'failed'
                            )
                              ? 'bg-red-500/10 border-red-500/20 text-red-400'
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          }
                        `}
                      >
                        {msgs[doc.id]}
                      </div>
                    )}

                  </div>
                </div>
              ))}
            </div>

            {/* BOTTOM BUTTON */}

            <div className="mt-8 sm:mt-10">

              <button
                onClick={() => navigate('/driver')}
                className="
                  w-full
                  h-14
                  sm:h-16
                  rounded-3xl
                  text-sm
                  sm:text-base
                  font-extrabold
                  tracking-wide
                  bg-gradient-to-r
                  from-yellow-400
                  via-orange-400
                  to-orange-500
                  text-black
                  shadow-[0_15px_40px_rgba(251,191,36,0.3)]
                  hover:scale-[1.01]
                  active:scale-[0.99]
                  transition-all
                  duration-300
                "
              >
                Done → Go to Dashboard
              </button>
            </div>

            {/* FOOTER */}

            <div className="mt-8 text-center">

              <div className="inline-flex items-center gap-2 text-white/30 text-xs sm:text-sm">

                <ImageIcon size={14} />

                <span>
                  Ensure documents are clear and readable
                </span>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default DriverDocuments;