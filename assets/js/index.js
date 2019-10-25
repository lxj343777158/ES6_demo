//1.对图片进行分类
//2.生成dom元素
//3.绑定事件
//4.显示到页面上

(function(window,document){

    let canChange = true;
    let count = 0;

const methods = {
    appendChild(parent, ...children){
        children.forEach(el =>{
            parent.appendChild(el);
        });
    },
    $(selector, root = document){
        return root.querySelector(selector);
    },
    $$(selector,root = document){
        return root.querySelectorAll(selector);
    }
};

let Img = function(opt){
    this._init(opt);//图片分类
    this._createElment();//生成dom元素
    this._bind();//绑定事件
    this._show();//效果展示
}

Img.prototype._init = function({data,initType,dom}){
    this.types = ['全部']; //所有分类
    this.all= [];  //所有图片
    this.classified = {'全部':[]}; //按照分类后的图片
    this.curType = initType; // 当前显示的图片分类
    this.dom = methods.$(dom); //挂载点
    this.imgContainer = null; //所有图片的容器
    this.wrap=null; //整体容器
    this.typeBtnEls=null;//所有分类按钮组成的数组
    this.figure = null;//所有当前显示的图片组成的数组

    this._classify(data);
};


Img.prototype._classify = function(data){

   let srcs=[];
   data.forEach(({title,type,alt,src}) =>{
       if(!this.types.includes(type)){
           this.types.push(type);
       }

       if(!Object.keys(this.classified).includes(type)){
           this.classified[type]= [];
       }

       if(!srcs.includes(src)){
           //图片没有生成过
           //生成图片
           //添加到对应的分类中
           srcs.push(src);

           let figure = document.createElement('figure');
           let img = document.createElement('img');
           let figcaption = document.createElement('figcaption');

           img.src =src;
           img.setAttribute('alt',alt);
           figcaption.innerText = title;

           methods.appendChild(figure,img,figcaption);
           this.all.push(figure);
           this.classified[type].push(this.all.length-1);     
           
       }else{
           //去all中找到对应的图片
           //添加到对应的分类中
           this.classified[type].push(srcs.findIndex(s1 => s1===src));
       }

   })
};


//根据分类获取图片
Img.prototype._getImgsByType = function(type){
    return type === '全部'? [...this.all] : this.classified[type].
    map(index => this.all[index]);
}

 //生成dom
Img.prototype._createElment = function(){
    //创建分类按钮
    let typesBtn= [];
    for(let type of this.types.values()){
       typesBtn.push(`<li class="img-classify-type-btn${ type === this.curType ? ' img-classify-type-btn-active':''}">${ type }</li>`);
    }

//整体的模板
    let tamplate =`
      <ul class="img-classify">
      ${typesBtn.join('')}
      </ul>
      <div class="img-container2"></div>
     `;

    let wrap = document.createElement('div');
     wrap.className = 'img-container';
     wrap.innerHTML = tamplate;


    this.imgContainer = methods.$('.img-container2', wrap);

    methods.appendChild(this.imgContainer, ...this._getImgsByType(this.curType));

      this.wrap =wrap;
      this.typeBtnEls = methods.$$('.img-classify-type-btn', wrap);
      this.figures = [...methods.$$('figure', wrap)];

      //遮罩层
      let overlay = document.createElement('div');
      overlay.className='img-overlay';
      overlay.innerHTML =`
         <div class="img-overlay-prev-btn"></div>
         <div class="img-overlay-next-btn"></div>
         <img src="" alt="">
         <figcaptipn class="img-overlay-title"></figcaption>
      `;
      methods.appendChild(this.wrap, overlay);
      this.overlay =overlay;
      this.previewImg = methods.$('img',overlay);

      this._calsPosition(this.figures);

};


//找出前后图片的共同图片
Img.prototype._diff = function(prevImgs,nextImgs){
    let diffArr = [];
     
    prevImgs.forEach((src1,index1) =>{
        let index2 =  nextImgs.findIndex(src2 => src1 === src2);
        if(index2 !== -1){
            diffArr.push([index1,index2]);
        }
    });

    return diffArr;
};



//绑定事件
Img.prototype._bind = function(){

  methods.$('.img-classify',this.wrap).addEventListener('click',
  ({target}) =>{

    if(target.nodeName !== 'LI') return;

    if(!canChange) return;
    canChange = false;
    
    const type = target.innerText;
    const els =this._getImgsByType(type);

    //点击之前图片集合
    let prevImgs = this.figures.map(figure => methods.$('img',
    figure).src);

    //点击之后图片集合
    let nextImgs = els.map(figure => methods.$('img',figure).src);

    const diffArr = this._diff(prevImgs,nextImgs);


    diffArr.forEach(([, i2]) =>{
        this.figures.every((figure,index) =>{
            let src = methods.$('img',figure).src;

            if(src === nextImgs[i2]){
                this.figures.splice(index,1);
                return false;
            }
            return true;
        })
    });

    this._calsPosition(els);

    let needAppendEls = [];

    if(diffArr.length){
        let nextElsIndex = diffArr.map(([,i2]) => i2);
        els.forEach((figure,index) =>{
            if(!nextElsIndex.includes(index)) needAppendEls.push(figure);
        });
    }else{
        needAppendEls =els;
    }

    this.figures.forEach(el =>{
        el.style.transform ='scale(0,0) translate(0,100%)';
        el.style.opacity ='0';
    });

    methods.appendChild(this.imgContainer, ...needAppendEls);

    setTimeout(() =>{
        els.forEach(el => {
            el.style.transform ='scale(1,1) translate(0,0)';
            el.style.opacity ='1';
        })
    })

    setTimeout(() =>{
    this.figures.forEach(figure => {
     this.imgContainer.removeChild(figure);
});
     this.figures = els;
     canChange = true;
    },600);

    this.typeBtnEls.forEach(btn =>( btn.className = 'img-classify-type-btn'));

    target.className = 'img-classify-type-btn img-classify-type-btn-active';
  });

  this.imgContainer.addEventListener('click', ({target}) =>{
   if(target.nodeName !== 'FIGURE' && target.nodeName !== 'FIGCAPTION') return;
   if(target.nodeName == 'FIGCAPTION'){
       target = target.parentNode;
   }

   const src =methods.$('img',target).src;

   count = this.figures.findIndex(figure => src === methods.$('img',figure).src); 

   const title = methods.$('figcaption',target).innerText;
   this.previewImg.src = src;
   methods.$('.img-overlay .img-overlay-title').innerText = title;
   this.overlay.style.display ='flex';
   setTimeout(() =>{
       this.overlay.style.opacity = '1';
   })

this.overlay.addEventListener('click',() =>{
    this.overlay.style.opacity = '0';
   setTimeout(() =>{
    this.overlay.style.display = 'none';
   },300);
})

});

methods.$('.img-overlay-prev-btn',this.overlay).addEventListener('click',e =>{
    e.stopPropagation();
    count = count == 0 ? count = this.figures.length -1 : count -1 ;
    this.previewImg.src = methods.$('img',this.figures[count]).src;
    methods.$('.img-overlay .img-overlay-title').innerText = methods.$('figcaption',this.figures[count]).innerText;
});


methods.$('.img-overlay-next-btn',this.overlay).addEventListener('click',e =>{
    e.stopPropagation();
    count = count == this.figures.length -1 ? 0 : count + 1 ;
    this.previewImg.src = methods.$('img',this.figures[count]).src;
    methods.$('.img-overlay .img-overlay-title').innerText = methods.$('figcaption',this.figures[count]).innerText;
})


};

//显示元素
Img.prototype._show = function(){
   
    methods.appendChild(this.dom,this.wrap);

    setTimeout(() =>{
        this.figures.forEach(figure =>{
            figure.style.transform = 'scale(1,1) translate(0,0)';
            figure.style.opacity = '1';
        })
    })
};

//计算图片的position的值
Img.prototype._calsPosition = function(figures){
    let horizontalImgIndex = 0;
    figures.forEach((figure,index) => {
        figure.style.top = parseInt(index/4) * 140 + parseInt(index/4) * 15 + 'px';
        figure.style.left = horizontalImgIndex * 240 + horizontalImgIndex * 15 +'px';
        figure.style.transform = 'scale(0,0) translate(0,-100%)';
        horizontalImgIndex = (horizontalImgIndex + 1) % 4;
    });

 let len = Math.ceil(figures.length / 4);
 this.imgContainer.style.height = len * 140 + (len - 1) * 15 + 'px';


}


window.$Img = Img;
})(window,document);